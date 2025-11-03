import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import crypto from "crypto";

export async function POST() {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = crypto.randomBytes(32).toString("hex");

    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/github/callback`;
    if (!clientId) {
      return NextResponse.json(
        { error: "GitHub OAuth not configured" },
        { status: 500 },
      );
    }

    // Build scopes
    const scopes = [
      "read:user",
      "user:email",
      "read:org",
      "repo",
      "repo:status",
    ].join(" ");

    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("allow_signup", "false");

    // Put state and user id into a short-lived, signed cookie
    const res = NextResponse.json({ authUrl: authUrl.toString(), state });
    // If you have a cookie signing helper, use it; for brevity we store raw here:
    res.cookies.set(
      "gh_oauth_state",
      JSON.stringify({
        s: state,
        u: authContext.userId,
        exp: Date.now() + 10 * 60 * 1000,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 10 * 60, // 10 minutes
      },
    );

    return res;
  } catch (error) {
    console.error("Error initiating GitHub OAuth:", error);
    return NextResponse.json(
      { error: "Failed to initiate authorization" },
      { status: 500 },
    );
  }
}
