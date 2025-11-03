// app/api/integrations/figma/save-file-keys/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tool_id, file_keys } = await req.json();

    if (
      !tool_id ||
      !file_keys ||
      !Array.isArray(file_keys) ||
      file_keys.length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid request: tool_id and file_keys array required" },
        { status: 400 },
      );
    }

    // Get user's current tool_connections
    const { data: user, error: userErr } = await supabaseAdmin
      .from("user_account")
      .select("user_id, tool_connections")
      .eq("clerk_id", auth.userId)
      .single();

    if (userErr || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify Figma is already connected
    const connections = user.tool_connections || {};
    if (!connections[tool_id]) {
      return NextResponse.json(
        { error: "Figma must be connected first via OAuth" },
        { status: 400 },
      );
    }

    // Update with file keys
    const updated = {
      ...connections,
      [tool_id]: {
        ...connections[tool_id],
        config: {
          ...connections[tool_id].config,
          file_keys: file_keys.filter((key: string) => key.trim().length > 0),
        },
      },
    };

    const { error: updateErr } = await supabaseAdmin
      .from("user_account")
      .update({ tool_connections: updated })
      .eq("user_id", user.user_id);

    if (updateErr) {
      console.error("Failed to save Figma file keys:", updateErr);
      return NextResponse.json(
        { error: "Failed to save file keys" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error saving Figma file keys:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
