// app/api/dashboard/team/published-reports/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// ---------- Types ----------
type WeekPreset = "this" | "last" | "last4" | "all";

type FeedRow = {
  reportId: number;
  userId: number;
  userName: string;
  weekStart: string; // ISO
  weekEnd: string; // ISO
  publishedAt: string; // ISO
  usefulActions: number;
  summarySnippet: string | null;
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

interface NestedUser {
  name?: string;
}

interface WeeklyReport {
  report_id: number;
  user_id: number;
  week_start: string;
  total_actions: number | null;
  total_minutes: number | null;
  project_time: Record<string, number> | null;
  daily_stats: Record<string, unknown> | null;
  published: boolean;
  created_at: string;
  user: NestedUser | NestedUser[] | null;
}

// ---------- Helpers ----------
function mondayOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun..6 Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// ---------- Route ----------
export async function GET(request: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") || "10")),
    );
    const q = (searchParams.get("q") || "").trim();
    const weekPreset = (searchParams.get("weekPreset") || "this") as WeekPreset;
    const sortBy = (searchParams.get("sortBy") || "publishedAt") as
      | "publishedAt"
      | "usefulActions"
      | "userName";
    const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";

    // Current user -> team & manager check
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("user_account")
      .select("user_id, team_id")
      .eq("clerk_id", authContext.userId)
      .single();

    const typedCurrentUser = currentUser as CurrentUser | null;

    if (userError || !typedCurrentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!typedCurrentUser.team_id) {
      return NextResponse.json(
        { error: "User is not part of any team" },
        { status: 403 },
      );
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from("team")
      .select("manager_id, name")
      .eq("team_id", typedCurrentUser.team_id)
      .single();

    const typedTeam = team as Team | null;

    if (teamError || !typedTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    if (typedTeam.manager_id !== typedCurrentUser.user_id) {
      return NextResponse.json(
        { error: "Access denied. Manager privileges required." },
        { status: 403 },
      );
    }

    // Team members
    const { data: teamMembers, error: membersError } = await supabaseAdmin
      .from("user_account")
      .select("user_id, name")
      .eq("team_id", typedCurrentUser.team_id)
      .is("deleted_at", null);

    if (membersError) {
      return NextResponse.json(
        { error: "Failed to fetch team members" },
        { status: 500 },
      );
    }

    const typedTeamMembers = (teamMembers as TeamMember[]) ?? [];
    const teamMemberIds = typedTeamMembers.map((m) => m.user_id);

    if (teamMemberIds.length === 0) {
      return NextResponse.json(
        { rows: [], total: 0, page, pageSize },
        { status: 200 },
      );
    }

    // Week filters
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
    // "all" => no bounds

    // Base query: published weekly reports for team users
    let base = supabaseAdmin
      .from("weekly_report")
      .select(
        `
        report_id,
        user_id,
        week_start,
        total_actions,
        total_minutes,
        project_time,
        daily_stats,
        published,
        created_at,
        user:user_id ( name )
      `,
        { count: "exact" },
      )
      .in("user_id", teamMemberIds)
      .eq("published", true);

    if (startBound && endBound) {
      base = base
        .gte("week_start", startBound.toISOString().slice(0, 10))
        .lte("week_start", endBound.toISOString().slice(0, 10));
    }

    // We'll over-fetch within a safe cap, then filter/sort/paginate in memory
    const { data: reports, error: rptError } = await base
      .order("created_at", { ascending: false })
      .limit(2000);

    if (rptError) {
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 },
      );
    }

    const typedReports = (reports as WeeklyReport[]) || [];

    // Build name map
    const memberNameMap = new Map<number, string>();
    typedTeamMembers.forEach((m) => memberNameMap.set(m.user_id, m.name));

    // Enrich rows
    const rows: FeedRow[] = [];

    const tasks = typedReports.map(async (r) => {
      const userId = r.user_id;

      // Supabase nested select can be object or array depending on relationship config
      const nestedUser = r.user;
      const nestedName =
        (nestedUser && typeof nestedUser === "object" && "name" in nestedUser
          ? nestedUser.name
          : Array.isArray(nestedUser) && nestedUser[0]?.name) || undefined;

      const userName = memberNameMap.get(userId) || nestedName || "Unknown";

      const ws = new Date(r.week_start);
      ws.setHours(0, 0, 0, 0);
      const we = addDays(ws, 6);
      we.setHours(23, 59, 59, 999);

      // Summary snippet
      let summarySnippet: string | null = null;
      try {
        const daily = r.daily_stats;
        if (daily && typeof daily === "object") {
          const text = JSON.stringify(daily);
          summarySnippet = text.replace(/["{}]/g, "").slice(0, 140) || null;
        }
        if ((!summarySnippet || summarySnippet.length < 8) && r.project_time) {
          const obj = r.project_time;
          const top = Object.entries(obj)
            .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${Math.round((v ?? 0) / 60)}h`)
            .join(", ");
          if (top) summarySnippet = `Focus: ${top}`;
        }
      } catch {
        // ignore malformed json
      }

      // Useful actions: count activity logs in that week for this user
      const { count: actionCount } = await supabaseAdmin
        .from("activity_log")
        .select("*", { head: true, count: "exact" })
        .eq("user_id", userId)
        .gte("event_time", ws.toISOString())
        .lte("event_time", we.toISOString());

      rows.push({
        reportId: r.report_id,
        userId,
        userName,
        weekStart: new Date(r.week_start).toISOString(),
        weekEnd: addDays(new Date(r.week_start), 6).toISOString(),
        publishedAt: new Date(r.created_at).toISOString(),
        usefulActions: actionCount || 0,
        summarySnippet,
      });
    });

    await Promise.all(tasks);

    // Search (user or summary)
    const qLower = q.toLowerCase();
    const filtered = q
      ? rows.filter(
          (r) =>
            r.userName.toLowerCase().includes(qLower) ||
            (r.summarySnippet ?? "").toLowerCase().includes(qLower),
        )
      : rows;

    // Sort
    const sorters: Record<typeof sortBy, (a: FeedRow, b: FeedRow) => number> = {
      userName: (a, b) => a.userName.localeCompare(b.userName),
      publishedAt: (a, b) =>
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
      usefulActions: (a, b) => a.usefulActions - b.usefulActions,
    };
    const sorter = sorters[sortBy] ?? sorters.publishedAt;
    filtered.sort((a, b) => (sortDir === "asc" ? sorter(a, b) : sorter(b, a)));

    // Pagination
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageRows = filtered.slice(start, end);

    return NextResponse.json(
      { rows: pageRows, total, page, pageSize },
      { status: 200 },
    );
  } catch (error) {
    console.error("published-reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
