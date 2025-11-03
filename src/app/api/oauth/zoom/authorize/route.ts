import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import crypto from "crypto";

const COOKIE = "zoom_oauth_state";

// pick the scopes you enabled on Zoom
const SCOPES = [
  "meeting:read:summary",
  "meeting:read:list_meetings",
  "meeting:read:meeting",
  "user:read:user",
].join(" ");

export async function POST() {
  const auth = await getAuthContext();
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Optional: carry tool_id from the client (not required for Zoom)

  const state = crypto.randomBytes(24).toString("hex");
  const payload = { s: state, u: auth.userId, exp: Date.now() + 10 * 60_000 };

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/zoom/callback`;
  const url = new URL("https://zoom.us/oauth/authorize");
  url.searchParams.set("client_id", process.env.ZOOM_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);

  const res = NextResponse.json({ authUrl: url.toString(), state });
  res.cookies.set(COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  });
  return res;
}
