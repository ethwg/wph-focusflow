// app/api/dashboard/team/user-week-log/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

interface Tool {
  name?: string;
}

type ToolJoin = Tool | Tool[] | null | undefined;

interface RequestUser {
  user_id: number;
  team_id: number | null;
}

interface TargetUser {
  user_id: number;
  team_id: number | null;
}

interface Team {
  manager_id: number | null;
}

interface ActivityLogRaw {
  log_id: number;
  event_time: string;
  minutes: number | null;
  title: string | null;
  tool: ToolJoin;
}

interface ActivityLogResponse {
  log_id: number;
  event_time: string;
  minutes: number;
  title: string | null;
  tool_name: string | null;
}

function getToolName(t: ToolJoin): string | null {
  if (!t) return null;
  if (Array.isArray(t)) return t[0]?.name ?? null;
  return t.name ?? null;
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get("userId") || "");
    const weekStart = searchParams.get("weekStart");
    const weekEnd = searchParams.get("weekEnd");

    if (!userId || !weekStart || !weekEnd) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 },
      );
    }

    // Verify the requester is a manager of the same team as userId
    const { data: reqUser } = await supabaseAdmin
      .from("user_account")
      .select("user_id, team_id")
      .eq("clerk_id", auth.userId)
      .single();

    const typedReqUser = reqUser as RequestUser | null;

    if (!typedReqUser?.team_id) {
      return NextResponse.json({ error: "Not in a team" }, { status: 403 });
    }

    const [{ data: targetUser }, { data: team }] = await Promise.all([
      supabaseAdmin
        .from("user_account")
        .select("user_id, team_id")
        .eq("user_id", userId)
        .single(),
      supabaseAdmin
        .from("team")
        .select("manager_id")
        .eq("team_id", typedReqUser.team_id)
        .single(),
    ]);

    const typedTargetUser = targetUser as TargetUser | null;
    const typedTeam = team as Team | null;

    if (!typedTargetUser || typedTargetUser.team_id !== typedReqUser.team_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (!typedTeam || typedTeam.manager_id !== typedReqUser.user_id) {
      return NextResponse.json(
        { error: "Manager privileges required" },
        { status: 403 },
      );
    }

    // Normalize bounds to full-day inclusive range
    const s = new Date(weekStart);
    s.setHours(0, 0, 0, 0);
    const e = new Date(weekEnd);
    e.setHours(23, 59, 59, 999);

    const { data, error } = await supabaseAdmin
      .from("activity_log")
      .select(
        `
        log_id,
        event_time,
        minutes,
        title,
        tool:tool_id ( name )
      `,
      )
      .eq("user_id", userId)
      .gte("event_time", s.toISOString())
      .lte("event_time", e.toISOString())
      .order("event_time", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch logs" },
        { status: 500 },
      );
    }

    const rawData = (data || []) as ActivityLogRaw[];

    const rows: ActivityLogResponse[] = rawData.map((r) => ({
      log_id: r.log_id,
      event_time: r.event_time,
      minutes: r.minutes ?? 0,
      title: r.title ?? null,
      tool_name: getToolName(r.tool),
    }));

    return NextResponse.json(rows, { status: 200 });
  } catch (e) {
    console.error("user-week-log error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
