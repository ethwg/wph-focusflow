// app/api/oauth/figma/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const COOKIE = "fig_oauth_state";

interface StateCookie {
  s: string; // state
  u: string; // user id
  exp: number; // expiration timestamp
}

interface FigmaTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  user_id_string?: string;
}

interface FigmaUser {
  id: string;
  handle: string;
  email: string;
}

interface ToolConnections {
  [toolId: string]: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    scope?: string;
    connected_at: string;
    expires_at: string;
    figma_user: {
      id: string;
      handle: string;
      email: string;
    };
    config: {
      auto_sync: boolean;
    };
  };
}

interface UserAccount {
  user_id: number;
  tool_connections: ToolConnections | Record<string, unknown>;
}

interface FigmaTool {
  tool_id: number;
}

const fail = (msg: string, state?: string | null) =>
  new NextResponse(
    `<html><body><script>
      window.opener?.postMessage({ type:'oauth-error', error:${JSON.stringify(msg)}, state:${JSON.stringify(state ?? null)} }, window.location.origin);
      window.close();
    </script></body></html>`,
    { headers: { "Content-Type": "text/html" } },
  );

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthErr = url.searchParams.get("error");

  if (oauthErr) return fail(oauthErr, state);
  if (!code || !state)
    return fail("Missing authorization code or state", state);

  // Validate state cookie
  const stored = request.cookies.get(COOKIE)?.value;
  if (!stored) return fail("Missing state cookie", state);

  let parsed: StateCookie;
  try {
    parsed = JSON.parse(stored) as StateCookie;
  } catch {
    return fail("Invalid state cookie", state);
  }
  if (parsed.s !== state) return fail("State mismatch", state);
  if (parsed.exp < Date.now()) return fail("State expired", state);

  const userId = parsed.u;

  try {
    // ----- 1) Exchange code for token (x-www-form-urlencoded + Basic auth) -----
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/figma/callback`;

    const basic = Buffer.from(
      `${process.env.FIGMA_CLIENT_ID}:${process.env.FIGMA_CLIENT_SECRET}`,
      "utf8",
    ).toString("base64");

    const tokenResp = await fetch("https://api.figma.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResp.ok)
      return fail("Failed to exchange authorization code", state);
    const tokenData = (await tokenResp.json()) as FigmaTokenResponse;
    const {
      access_token,
      token_type,
      refresh_token,
      expires_in,
      user_id_string,
    } = tokenData;

    // ----- 2) Fetch current user (/v1/me) -----
    const meResp = await fetch("https://api.figma.com/v1/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
      },
    });
    if (!meResp.ok) return fail("Failed to fetch Figma user profile", state);
    const me = (await meResp.json()) as FigmaUser;

    // ----- 3) Look up your app user + tool_id for Figma -----
    const { data: appUser, error: userErr } = await supabaseAdmin
      .from("user_account")
      .select("user_id, tool_connections")
      .eq("clerk_id", userId)
      .single();
    if (userErr || !appUser) return fail("User not found", state);

    const typedAppUser = appUser as UserAccount;

    const { data: figmaTool, error: toolErr } = await supabaseAdmin
      .from("tool")
      .select("tool_id")
      .eq("name", "Figma")
      .single();
    if (toolErr || !figmaTool) return fail("Figma tool not found", state);

    const typedFigmaTool = figmaTool as FigmaTool;

    // ----- 4) Persist tool_connections[tool_id] -----
    const now = Date.now();
    const expiresAt = new Date(
      now + Number(expires_in || 3600) * 1000,
    ).toISOString();

    const updated: ToolConnections = {
      ...(typedAppUser.tool_connections as ToolConnections),
      [typedFigmaTool.tool_id]: {
        access_token,
        refresh_token,
        token_type,
        scope: undefined,
        connected_at: new Date().toISOString(),
        expires_at: expiresAt,
        figma_user: {
          id: user_id_string ?? me.id,
          handle: me.handle,
          email: me.email,
        },
        config: { auto_sync: true },
      },
    };

    const { error: updErr } = await supabaseAdmin
      .from("user_account")
      .update({ tool_connections: updated })
      .eq("user_id", typedAppUser.user_id);
    if (updErr) return fail("Failed to save connection", state);

    // ----- 5) Success page that notifies opener -----
    const html = `
      <html><head><title>Connected</title></head>
      <body>
        <script>
          window.opener?.postMessage({ type:'oauth-success', state:${JSON.stringify(state)} }, window.location.origin);
          setTimeout(() => window.close(), 800);
        </script>
      </body></html>`;
    const res = new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
    res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("Figma OAuth callback error:", e);
    const errorMessage =
      e instanceof Error ? e.message : "Authorization failed";
    return fail(errorMessage, state);
  }
}
