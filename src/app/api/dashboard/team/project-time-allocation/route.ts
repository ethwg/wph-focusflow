// app/api/dashboard/team/project-time-allocation/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

type WeekPreset = "this" | "last" | "last4" | "all";

type UserAlloc = {
  userId: number;
  userName: string;
  totalMinutes: number;
  allocations: { category: string; minutes: number }[];
};

interface CurrentUser {
  user_id: number;
  team_id: number | null;
}

interface Team {
  manager_id: number | null;
  name: string;
}

interface TeamMember {
  user_id: number;
  name: string;
}

interface WeeklyReport {
  user_id: number;
  week_start: string;
  project_time: Record<string, number> | null;
}

interface Template {
  display_name?: string;
}

interface Tool {
  name?: string;
}

type JoinTemplate = Template | Template[] | null | undefined;
type JoinTool = Tool | Tool[] | null | undefined;

interface ActivityLog {
  user_id: number;
  minutes: number | null;
  title: string | null;
  template: JoinTemplate;
  tool: JoinTool;
  event_time: string;
}

function mondayOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun..6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const weekPreset = (searchParams.get("weekPreset") || "this") as WeekPreset;

    // Current user -> team & manager check
    const { data: currentUser, error: userErr } = await supabaseAdmin
      .from("user_account")
      .select("user_id, team_id")
      .eq("clerk_id", auth.userId)
      .single();

    const typedCurrentUser = currentUser as CurrentUser | null;

    if (userErr || !typedCurrentUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!typedCurrentUser.team_id)
      return NextResponse.json({ error: "Not in a team" }, { status: 403 });

    const { data: team, error: teamErr } = await supabaseAdmin
      .from("team")
      .select("manager_id, name")
      .eq("team_id", typedCurrentUser.team_id)
      .single();

    const typedTeam = team as Team | null;

    if (teamErr || !typedTeam)
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (typedTeam.manager_id !== typedCurrentUser.user_id)
      return NextResponse.json(
        { error: "Manager privileges required" },
        { status: 403 },
      );

    // Team members
    const { data: members, error: memErr } = await supabaseAdmin
      .from("user_account")
      .select("user_id, name")
      .eq("team_id", typedCurrentUser.team_id)
      .is("deleted_at", null);
    if (memErr)
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 },
      );

    const typedMembers = (members as TeamMember[]) ?? [];
    const ids = typedMembers.map((m) => m.user_id);

    if (ids.length === 0)
      return NextResponse.json(
        { teamName: typedTeam.name, rows: [] },
        { status: 200 },
      );

    // Time bounds
    const nowMon = mondayOf(new Date());
    let startBound: Date | null = null;
    let endBound: Date | null = null;
    if (weekPreset === "this") {
      startBound = nowMon;
      endBound = addDays(nowMon, 6);
    } else if (weekPreset === "last") {
      startBound = addDays(nowMon, -7);
      endBound = addDays(nowMon, -1);
    } else if (weekPreset === "last4") {
      startBound = addDays(nowMon, -28);
      endBound = addDays(nowMon, 6);
    }
    const startIso = startBound ? startBound.toISOString().slice(0, 10) : null;

    // 1) Try weekly_report.project_time (preferred)
    let wrQuery = supabaseAdmin
      .from("weekly_report")
      .select("user_id, week_start, project_time")
      .in("user_id", ids);

    if (startBound && endBound) {
      wrQuery = wrQuery
        .gte("week_start", startIso!)
        .lte("week_start", endBound.toISOString().slice(0, 10));
    }
    const { data: reports, error: wrErr } = await wrQuery;
    if (wrErr)
      return NextResponse.json(
        { error: "Failed to fetch weekly reports" },
        { status: 500 },
      );

    const typedReports = (reports as WeeklyReport[]) ?? [];

    // Build base map per user
    const nameMap = new Map<number, string>();
    typedMembers.forEach((m) => nameMap.set(m.user_id, m.name));

    const perUser: Record<number, Record<string, number>> = {};
    const hasProjectTime: Record<number, boolean> = {};

    typedReports.forEach((r) => {
      if (!r || !r.project_time) return;
      const u = r.user_id;
      hasProjectTime[u] = true;
      perUser[u] = perUser[u] || {};
      try {
        const obj = r.project_time;
        for (const [k, v] of Object.entries(obj || {})) {
          perUser[u][k] = (perUser[u][k] ?? 0) + (Number(v) || 0);
        }
      } catch {
        // ignore malformed json
      }
    });

    // 2) Fallback for users without project_time — derive from activity_log.minutes grouped by category
    // Category preference: action_template.display_name -> tool.name -> "Uncategorized"
    const fallbackUserIds = ids.filter((u) => !hasProjectTime[u]);

    if (fallbackUserIds.length > 0) {
      const s = startBound ? new Date(startBound) : null;
      const e = endBound ? new Date(endBound) : null;
      if (s) s.setHours(0, 0, 0, 0);
      if (e) e.setHours(23, 59, 59, 999);

      const { data: acts, error: actErr } = await supabaseAdmin
        .from("activity_log")
        .select(
          `
          user_id,
          minutes,
          title,
          template:template_id ( display_name ),
          tool:tool_id ( name ),
          event_time
        `,
        )
        .in("user_id", fallbackUserIds)
        .gte("event_time", s ? s.toISOString() : "1970-01-01T00:00:00.000Z")
        .lte("event_time", e ? e.toISOString() : new Date().toISOString());
      if (actErr)
        return NextResponse.json(
          { error: "Failed to fetch activities" },
          { status: 500 },
        );

      const typedActs = (acts as ActivityLog[]) ?? [];

      const getName = (t: JoinTemplate): string | null => {
        if (!t) return null;
        if (Array.isArray(t)) return t[0]?.display_name ?? null;
        return t.display_name ?? null;
      };
      const getTool = (t: JoinTool): string | null => {
        if (!t) return null;
        if (Array.isArray(t)) return t[0]?.name ?? null;
        return t.name ?? null;
      };

      typedActs.forEach((a) => {
        const u = a.user_id;
        perUser[u] = perUser[u] || {};
        const cat = getName(a.template) || getTool(a.tool) || "Uncategorized";
        const mins = Number(a.minutes) || 0;
        perUser[u][cat] = (perUser[u][cat] ?? 0) + mins;
      });
    }

    // Compose response
    const rows: UserAlloc[] = ids.map((u) => {
      const allocs = Object.entries(perUser[u] ?? {})
        .map(([category, minutes]) => ({ category, minutes }))
        .sort((a, b) => b.minutes - a.minutes);

      const totalMinutes = allocs.reduce((s, x) => s + x.minutes, 0);
      return {
        userId: u,
        userName: nameMap.get(u) || "Unknown",
        totalMinutes,
        allocations: allocs,
      };
    });

    // Sort users by total desc
    rows.sort((a, b) => b.totalMinutes - a.totalMinutes);

    return NextResponse.json(
      {
        teamName: typedTeam.name,
        weekPreset,
        rows,
      },
      { status: 200 },
    );
  } catch (e) {
    console.error("project-time-allocation error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
