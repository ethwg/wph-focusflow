import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

interface PrivacySettings {
  tool_permissions?: Record<string, boolean>;
  tool_permissions_by_id?: Record<string, boolean>;
  [key: string]: unknown;
}

interface ToolConnections {
  [key: string]: unknown;
}

interface CurrentUser {
  user_id: number;
  role_id: number | null;
  privacy_settings: PrivacySettings;
  tool_connections: ToolConnections;
}

interface Role {
  name: string;
  default_tools: string[] | Record<string, unknown>;
}

interface Tool {
  tool_id: number;
  name: string;
  category: string | null;
  integration_type: string | null;
}

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1) Current user (include privacy + connections)
    const { data: currentUser, error: userErr } = await supabaseAdmin
      .from("user_account")
      .select("user_id, role_id, privacy_settings, tool_connections")
      .eq("clerk_id", auth.userId)
      .single();

    if (userErr || !currentUser) {
      console.error("Error fetching current user:", userErr);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const typedUser = currentUser as CurrentUser;

    if (!typedUser.role_id) {
      return NextResponse.json(
        { error: "User has no role assigned" },
        { status: 400 },
      );
    }

    // 2) Role (names of tools this role can see)
    const { data: role, error: roleErr } = await supabaseAdmin
      .from("role")
      .select("name, default_tools")
      .eq("role_id", typedUser.role_id)
      .single();

    if (roleErr || !role) {
      console.error("Error fetching role:", roleErr);
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const typedRole = role as Role;

    // 3) All active tools
    const { data: allTools, error: toolsErr } = await supabaseAdmin
      .from("tool")
      .select("tool_id, name, category, integration_type")
      .eq("active", true)
      .order("name", { ascending: true });

    if (toolsErr) {
      console.error("Error fetching tools:", toolsErr);
      return NextResponse.json(
        { error: "Failed to fetch tools" },
        { status: 500 },
      );
    }

    const typedTools = (allTools as Tool[]) ?? [];

    // 4) Filter tools by role.default_tools
    const defaultToolNames: string[] = Array.isArray(typedRole.default_tools)
      ? typedRole.default_tools
      : [];
    const roleTools = typedTools.filter((t) =>
      defaultToolNames.includes(t.name),
    );

    // 5) Permissions (legacy by name + preferred by id)
    const privacy = (typedUser.privacy_settings ?? {}) as PrivacySettings;
    const legacyByName: Record<string, boolean> =
      privacy.tool_permissions ?? {};
    let byId: Record<string, boolean> = privacy.tool_permissions_by_id ?? {};

    // If id-keyed map isn't set yet, derive it from legacy name-keyed
    if (!byId || typeof byId !== "object") {
      const derived: Record<string, boolean> = {};
      for (const t of roleTools) {
        const val = legacyByName[t.name];
        if (typeof val === "boolean") {
          derived[String(t.tool_id)] = val;
        }
      }
      byId = derived;
    }

    // 6) tool_connections (only for visible tools; keys as strings)
    const rawConnections = (typedUser.tool_connections ??
      {}) as ToolConnections;
    const toolConnections: Record<string, unknown> = {};
    for (const t of roleTools) {
      const key = String(t.tool_id);
      if (key in rawConnections) {
        toolConnections[key] = rawConnections[key];
      }
    }

    // 7) Respond with everything the UI expects
    return NextResponse.json(
      {
        tools: roleTools,
        roleName: typedRole.name,
        toolPermissions: legacyByName, // legacy (name-keyed)
        toolPermissionsById: byId, // ✅ preferred (id-keyed)
        toolConnections, // ✅ drives "Configured" state
      },
      { status: 200 },
    );
  } catch (e) {
    console.error("Error fetching tools:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
