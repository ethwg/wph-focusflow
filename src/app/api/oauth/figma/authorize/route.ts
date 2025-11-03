// app/api/oauth/figma/authorize/route.ts
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import crypto from "crypto";

const COOKIE = "fig_oauth_state";

// Choose scopes you decided above
const SCOPES = [
  "current_user:read",
  "file_comments:read",
  "file_content:read",
  "file_metadata:read",
  "file_versions:read",
  "projects:read",
].join(" ");

export async function POST() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = crypto.randomBytes(24).toString("hex");
  const payload = { s: state, u: auth.userId, exp: Date.now() + 10 * 60_000 };

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/figma/callback`;
  const url = new URL("https://www.figma.com/oauth");
  url.searchParams.set("client_id", process.env.FIGMA_CLIENT_ID || "");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code"); // Figma supports only "code"

  const res = NextResponse.json({ authUrl: url.toString(), state });
  res.cookies.set(COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return res;
}
