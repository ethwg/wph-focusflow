import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface StateCookie {
  s: string; // state
  u: string; // user id
  exp: number; // expiration timestamp
}

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  scope: string;
  expires_in: number;
}

interface ZoomUser {
  id: string;
  account_id: string;
  email: string;
  first_name: string;
  last_name: string;
  timezone: string;
  type: number;
  pmi: number;
}

interface ToolConnections {
  [toolId: string]: {
    provider: string;
    token_type: string;
    scope: string;
    access_token: string;
    refresh_token: string;
    expires_at: string;
    connected_at: string;
    zoom_user: ZoomUser;
    config: {
      auto_sync: boolean;
    };
  };
}

interface UserAccount {
  user_id: number;
  tool_connections: ToolConnections | Record<string, unknown>;
}

interface ZoomTool {
  tool_id: number;
}

// helper to postMessage error back to opener
const fail = (msg: string, state?: string | null) =>
  new NextResponse(
    `
    <html><body><script>
      window.opener?.postMessage({ type:'oauth-error', error:${JSON.stringify(msg)}, state:${JSON.stringify(state)} }, window.location.origin);
      window.close();
    </script></body></html>
  `,
    { headers: { "Content-Type": "text/html" } },
  );

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  if (err) return fail(err, state);
  if (!code || !state)
    return fail("Missing authorization code or state", state);

  try {
    // Validate state cookie
    const cookie = request.cookies.get("zoom_oauth_state")?.value;
    if (!cookie) return fail("Missing state cookie", state);

    let parsed: StateCookie;
    try {
      parsed = JSON.parse(cookie) as StateCookie;
    } catch {
      return fail("Invalid state cookie", state);
    }
    if (parsed.s !== state) return fail("State mismatch", state);
    if (parsed.exp < Date.now()) return fail("State expired", state);

    const clerkUserId = parsed.u;

    // Exchange code -> tokens (Basic auth with client_id:client_secret)
    const basic = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`,
    ).toString("base64");

    const tokenResp = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/zoom/callback`,
      }),
    });

    if (!tokenResp.ok)
      return fail("Failed to exchange authorization code", state);
    const tokenJson = (await tokenResp.json()) as ZoomTokenResponse;

    if (!tokenJson.access_token) return fail("No access token returned", state);

    const {
      access_token,
      token_type,
      refresh_token,
      scope, // space-separated scopes granted
      expires_in, // seconds until expiry
    } = tokenJson;

    const expires_at = new Date(
      Date.now() + (expires_in ?? 3600) * 1000,
    ).toISOString();

    // Fetch Zoom user profile
    const meResp = await fetch("https://api.zoom.us/v2/users/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!meResp.ok) return fail("Failed to fetch Zoom user", state);
    const me = (await meResp.json()) as ZoomUser;

    // Get our user row
    const { data: userRow, error: userErr } = await supabaseAdmin
      .from("user_account")
      .select("user_id, tool_connections")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userErr || !userRow) return fail("User not found", state);

    const typedUserRow = userRow as UserAccount;

    // Lookup Zoom tool_id
    const { data: zoomTool, error: toolErr } = await supabaseAdmin
      .from("tool")
      .select("tool_id")
      .eq("name", "Zoom")
      .single();

    if (toolErr || !zoomTool) return fail("Zoom tool not found", state);

    const typedZoomTool = zoomTool as ZoomTool;

    const updatedConnections: ToolConnections = {
      ...(typedUserRow.tool_connections as ToolConnections),
      [String(typedZoomTool.tool_id)]: {
        provider: "zoom",
        token_type,
        scope, // as returned (string)
        access_token,
        refresh_token,
        expires_at,
        connected_at: new Date().toISOString(),
        zoom_user: {
          id: me.id,
          account_id: me.account_id,
          email: me.email,
          first_name: me.first_name,
          last_name: me.last_name,
          timezone: me.timezone,
          type: me.type,
          pmi: me.pmi,
        },
        config: { auto_sync: true },
      },
    };

    const { error: updateErr } = await supabaseAdmin
      .from("user_account")
      .update({ tool_connections: updatedConnections })
      .eq("user_id", typedUserRow.user_id);

    if (updateErr) return fail("Failed to save connection", state);

    // Success page -> postMessage back
    const html = `
      <html><body>
        <script>
          window.opener?.postMessage({ type:'oauth-success', state:${JSON.stringify(state)} }, window.location.origin);
          setTimeout(() => window.close(), 1000);
        </script>
      </body></html>
    `;
    const res = new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
    // clear cookie
    res.cookies.set("zoom_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("Zoom OAuth callback error:", e);
    const errorMessage =
      e instanceof Error ? e.message : "Authorization failed";
    return new NextResponse(
      `
      <html><body><script>
        window.opener?.postMessage({ type:'oauth-error', error:${JSON.stringify(
          errorMessage,
        )}, state:${JSON.stringify(state)} }, window.location.origin);
        setTimeout(() => window.close(), 1000);
      </script></body></html>
    `,
      { headers: { "Content-Type": "text/html" } },
    );
  }
}
