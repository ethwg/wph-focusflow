import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface StateCookie {
  s: string; // state
  u: string; // user id
  exp: number; // expiration timestamp
}

interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string; // comma-separated
  error?: string;
  error_description?: string;
}

interface GitHubUser {
  id: number;
  login: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility?: string | null;
}

interface UserAccount {
  user_id: number;
  tool_connections: Record<string, unknown> | null;
}

interface GitHubTool {
  tool_id: number;
}

interface NormalizedConnection {
  provider: "GitHub";
  access_token: string;
  token_type: string;
  scopes: string[];
  connected_at: string;
  account: {
    id: string;
    username: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  config: {
    auto_sync: boolean;
  };
  last_sync_at: string | null;
  sync_cursor: string | null;
  version: number;
}

// ---- Utility: small HTML responses for popup postMessage ----
const okHtml = (state: string) => `
  <html>
    <head><title>Authorization Successful</title></head>
    <body>
      <script>
        window.opener.postMessage({ type:'oauth-success', state:${JSON.stringify(state)} }, window.location.origin);
        setTimeout(() => window.close(), 1000);
      </script>
    </body>
  </html>
`;

const errHtml = (state: string | null, msg: string) => `
  <html>
    <head><title>Authorization Failed</title></head>
    <body>
      <script>
        window.opener.postMessage({ type:'oauth-error', error:${JSON.stringify(msg)}, state:${JSON.stringify(state)} }, window.location.origin);
        setTimeout(() => window.close(), 1000);
      </script>
    </body>
  </html>
`;

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const fail = (msg: string) =>
    new NextResponse(errHtml(state, msg), {
      headers: { "Content-Type": "text/html" },
    });

  if (errorParam) return fail(errorParam);
  if (!code || !state) return fail("Missing authorization code or state");

  try {
    // --- 1) Validate state from cookie (avoid in-memory store in serverless) ---
    const stateCookie = request.cookies.get("gh_oauth_state")?.value;
    if (!stateCookie) return fail("Missing state cookie");

    let parsed: StateCookie;
    try {
      parsed = JSON.parse(stateCookie) as StateCookie;
    } catch {
      return fail("Invalid state cookie");
    }

    if (parsed.s !== state) return fail("State mismatch");
    if (parsed.exp < Date.now()) return fail("State expired");

    const userId = parsed.u;

    // --- 2) Exchange code for token ---
    const tokenResp = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          // Keep this if it EXACTLY matches your GitHub App callback; otherwise omit it.
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/github/callback`,
        }),
      },
    );
    if (!tokenResp.ok) return fail("Failed to exchange authorization code");

    const tokenData = (await tokenResp.json()) as GitHubTokenResponse;

    if (tokenData.error)
      return fail(tokenData.error_description || tokenData.error);

    const access_token = tokenData.access_token!;
    const token_type = tokenData.token_type || "Bearer";
    const scopeStr = tokenData.scope || "";
    const scopesArray = scopeStr ? scopeStr.split(",") : [];

    // --- 3) Fetch GitHub user (and primary email if needed) ---
    const ghHeaders = {
      Authorization: `${token_type} ${access_token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "FocusFlow-OAuth",
    };

    const ghUserResp = await fetch("https://api.github.com/user", {
      headers: ghHeaders,
    });
    if (!ghUserResp.ok) return fail("Failed to fetch GitHub user");
    const githubUser = (await ghUserResp.json()) as GitHubUser;

    let primaryEmail: string | null = githubUser.email ?? null;
    if (!primaryEmail) {
      const emailsResp = await fetch("https://api.github.com/user/emails", {
        headers: ghHeaders,
      });
      if (emailsResp.ok) {
        const emails = (await emailsResp.json()) as GitHubEmail[];
        const primary = Array.isArray(emails)
          ? emails.find((e) => e?.primary)
          : null;
        primaryEmail = primary?.email ?? null;
      }
    }

    // --- 4) Look up our user & the GitHub tool_id ---
    const { data: user, error: userError } = await supabaseAdmin
      .from("user_account")
      .select("user_id, tool_connections")
      .eq("clerk_id", userId)
      .single();
    if (userError || !user) return fail("User not found");

    const typedUser = user as UserAccount;

    const { data: githubTool, error: toolError } = await supabaseAdmin
      .from("tool")
      .select("tool_id")
      .eq("name", "GitHub")
      .single();
    if (toolError || !githubTool) return fail("GitHub tool not found");

    const typedGitHubTool = githubTool as GitHubTool;

    // --- 5) Build normalized connection payload (per-tool) ---
    const normalizedConnection: NormalizedConnection = {
      provider: "GitHub",
      access_token, // Consider encrypting / storing a reference instead
      token_type,
      scopes: scopesArray, // array for easier querying
      connected_at: new Date().toISOString(),
      account: {
        id: String(githubUser.id),
        username: githubUser.login,
        name: githubUser.name ?? null,
        email: primaryEmail ?? null,
        avatar_url: githubUser.avatar_url ?? null,
        // orgs: [] // you can enrich later by calling /user/orgs
      },
      config: { auto_sync: true },
      last_sync_at: null,
      sync_cursor: null,
      version: 1,
    };

    const updatedConnections = {
      ...(typedUser.tool_connections || {}),
      [typedGitHubTool.tool_id]: normalizedConnection,
    };

    const { error: updateError } = await supabaseAdmin
      .from("user_account")
      .update({ tool_connections: updatedConnections })
      .eq("user_id", typedUser.user_id);
    if (updateError) return fail("Failed to save connection");

    // --- 6) Success: clear state cookie & notify opener ---
    const res = new NextResponse(okHtml(state), {
      headers: { "Content-Type": "text/html" },
    });
    res.cookies.set("gh_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("GitHub OAuth callback error:", e);
    const errorMessage =
      e instanceof Error ? e.message : "Authorization failed";
    return new NextResponse(errHtml(state, errorMessage), {
      headers: { "Content-Type": "text/html" },
    });
  }
}
