import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const roleId = searchParams.get("roleId");

    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required" },
        { status: 400 },
      );
    }

    // Fetch the role with its default_tools
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("role")
      .select("default_tools")
      .eq("role_id", roleId)
      .single();

    if (roleError) {
      console.error("Supabase error fetching role:", roleError);
      return NextResponse.json(
        { error: "Failed to fetch role" },
        { status: 500 },
      );
    }

    // Get the tool names from default_tools (stored as JSONB array like ["WhatsApp", "Zoom"])
    const toolNames = roleData.default_tools || [];

    if (toolNames.length === 0) {
      return NextResponse.json({ tools: [] }, { status: 200 });
    }

    // Fetch the tools that match the names in default_tools
    const { data: toolsData, error: toolsError } = await supabaseAdmin
      .from("tool")
      .select("tool_id, name, category, integration_type")
      .in("name", toolNames)
      .eq("active", true)
      .order("name");

    if (toolsError) {
      console.error("Supabase error fetching tools:", toolsError);
      return NextResponse.json(
        { error: "Failed to fetch tools" },
        { status: 500 },
      );
    }

    return NextResponse.json({ tools: toolsData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tools:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
