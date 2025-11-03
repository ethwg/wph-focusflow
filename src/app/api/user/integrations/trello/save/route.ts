import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tool_id, api_key, token } = await req.json();

    if (!tool_id || !api_key || !token) {
      return NextResponse.json(
        { error: "Missing tool_id, api_key or token" },
        { status: 400 },
      );
    }

    // Load user
    const { data: user, error: userErr } = await supabaseAdmin
      .from("user_account")
      .select("user_id, tool_connections")
      .eq("clerk_id", auth.userId)
      .single();

    if (userErr || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Optional: verify Trello token by calling /members/me
    const verifyResp = await fetch(
      `https://api.trello.com/1/members/me?key=${encodeURIComponent(api_key)}&token=${encodeURIComponent(token)}`,
    );

    if (!verifyResp.ok) {
      const txt = await verifyResp.text().catch(() => "");
      return NextResponse.json(
        { error: `Trello verification failed: ${txt || verifyResp.status}` },
        { status: 400 },
      );
    }

    const me = await verifyResp.json();

    const updatedConnections = {
      ...(user.tool_connections || {}),
      [String(tool_id)]: {
        provider: "trello",
        api_key,
        token,
        connected_at: new Date().toISOString(),
        trello_user: {
          id: me.id,
          username: me.username,
          fullName: me.fullName,
          url: me.url,
        },
        config: { read_only: true },
      },
    };

    const { error: updErr } = await supabaseAdmin
      .from("user_account")
      .update({ tool_connections: updatedConnections })
      .eq("user_id", user.user_id);

    if (updErr) {
      return NextResponse.json(
        { error: "Failed to save connection" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("trello/save error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
