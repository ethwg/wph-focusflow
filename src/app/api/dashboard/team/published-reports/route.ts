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

interface WeeklyReport {
  report_id: number;
  user_id: number;
  week_start: string; // DATE (YYYY-MM-DD)
  total_actions: number | null; // <-- use this
  total_minutes: number | null;
  project_time: Record<string, number> | null;
  daily_stats: Record<string, unknown> | null;
  published: boolean;
  created_at: string;
}

// ---------- Helpers ----------
const TZ = "Australia/Melbourne";

function melDateOnly(date: Date) {
  const yyyy = new Intl.DateTimeFormat("en", {
    timeZone: TZ,
    year: "numeric",
  }).format(date);
  const mm = new Intl.DateTimeFormat("en", {
    timeZone: TZ,
    month: "2-digit",
  }).format(date);
  const dd = new Intl.DateTimeFormat("en", {
    timeZone: TZ,
    day: "2-digit",
  }).format(date);
  return `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD in Melbourne
}

function mondayOfMel(date = new Date()) {
  // Compute Monday using Melbourne-local weekday
  const d = new Date(date);
  // Make a Melbourne-local date by stripping to YYYY-MM-DD in Melbourne
  const local = new Date(`${melDateOnly(d)}T00:00:00`);
  const weekday = new Intl.DateTimeFormat("en", {
    timeZone: TZ,
    weekday: "short",
  }).format(local); // Mon..Sun (string)
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const w = map[weekday.slice(0, 3)] ?? 0;
  const monday = new Date(local);
  monday.setDate(local.getDate() - w);
  return monday; // local-midnight-ish ISO
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// ---------- Route ----------
export async function GET(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)),
    );
    const q = (searchParams.get("q") || "").trim();
    const weekPreset = (searchParams.get("weekPreset") || "this") as WeekPreset;
    const sortBy = (searchParams.get("sortBy") || "publishedAt") as
      | "publishedAt"
      | "usefulActions"
      | "userName";
    const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";

    // Caller -> team & manager check
    const { data: meRaw, error: meErr } = await supabaseAdmin
      .from("user_account")
      .select("user_id, team_id")
      .eq("clerk_id", auth.userId)
      .is("deleted_at", null)
      .single();

    const me = meRaw as CurrentUser | null;
    if (meErr || !me)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!me.team_id)
      return NextResponse.json(
        { error: "User is not part of any team" },
        { status: 403 },
      );

    const { data: teamRaw, error: teamErr } = await supabaseAdmin
      .from("team")
      .select("manager_id, name")
      .eq("team_id", me.team_id)
      .single();

    const team = teamRaw as Team | null;
    if (teamErr || !team)
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team.manager_id !== me.user_id) {
      return NextResponse.json(
        { error: "Access denied. Manager privileges required." },
        { status: 403 },
      );
    }

    // Team members (active)
    const { data: membersRaw, error: membersErr } = await supabaseAdmin
      .from("user_account")
      .select("user_id, name")
      .eq("team_id", me.team_id)
      .is("deleted_at", null);

    if (membersErr)
      return NextResponse.json(
        { error: "Failed to fetch team members" },
        { status: 500 },
      );

    const members = (membersRaw as TeamMember[]) ?? [];
    if (members.length === 0)
      return NextResponse.json(
        { rows: [], total: 0, page, pageSize },
        { status: 200 },
      );

    const memberIds = members.map((m) => m.user_id);
    const nameById = new Map<number, string>(
      members.map((m) => [m.user_id, m.name]),
    );

    // Week filters (Melbourne)
    const baseMonday = mondayOfMel(new Date());
    let startBound: string | null = null;
    let endBound: string | null = null;

    if (weekPreset === "this") {
      startBound = melDateOnly(baseMonday);
      endBound = melDateOnly(addDays(baseMonday, 6));
    } else if (weekPreset === "last") {
      const lastMon = addDays(baseMonday, -7);
      startBound = melDateOnly(lastMon);
      endBound = melDateOnly(addDays(lastMon, 6));
    } else if (weekPreset === "last4") {
      const fourAgo = addDays(baseMonday, -28);
      startBound = melDateOnly(fourAgo);
      endBound = melDateOnly(addDays(baseMonday, 6));
    }

    // Build base query: published weekly reports for team
    // We’ll page at DB when sorting by created_at/total_actions; for userName we’ll sort in-memory.
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
          created_at
        `,
        { count: "exact" },
      )
      .in("user_id", memberIds)
      .eq("published", true);

    if (startBound && endBound) {
      base = base.gte("week_start", startBound).lte("week_start", endBound);
    }

    // Search: name or snippet-like fields (we don't have ai_summary on weekly_report here)
    // We'll fetch more then filter in memory when q is present.
    // Sorting: for publishedAt/usefulActions we can order in DB; for userName we do in memory.
    const canDbOrder = sortBy !== "userName";
    if (canDbOrder) {
      if (sortBy === "publishedAt")
        base = base.order("created_at", { ascending: sortDir === "asc" });
      if (sortBy === "usefulActions")
        base = base.order("total_actions", { ascending: sortDir === "asc" });
      // DB pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const {
        data: reportsRaw,
        error: rptErr,
        count,
      } = await base.range(from, to);
      if (rptErr)
        return NextResponse.json(
          { error: "Failed to fetch reports" },
          { status: 500 },
        );

      const reports = (reportsRaw as WeeklyReport[]) ?? [];
      const rows: FeedRow[] = reports.map((r) => {
        const wsIso = `${r.week_start}T00:00:00.000Z`;
        const weIso = `${melDateOnly(addDays(new Date(`${r.week_start}T00:00:00`), 6))}T23:59:59.999Z`;

        // Build a tiny summary snippet from project_time/daily_stats if present
        let snippet: string | null = null;
        try {
          if (r.project_time && Object.keys(r.project_time).length) {
            const top = Object.entries(r.project_time)
              .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
              .slice(0, 3)
              .map(([k, v]) => `${k}: ${Math.round((v ?? 0) / 60)}h`)
              .join(", ");
            if (top) snippet = `Focus: ${top}`;
          } else if (r.daily_stats) {
            const text = JSON.stringify(r.daily_stats);
            const cleaned = text.replace(/["{}]/g, "");
            snippet = cleaned.slice(0, 140) || null;
          }
        } catch {
          /* ignore */
        }

        return {
          reportId: r.report_id,
          userId: r.user_id,
          userName: nameById.get(r.user_id) ?? "Unknown",
          weekStart: wsIso,
          weekEnd: weIso,
          publishedAt: new Date(r.created_at).toISOString(),
          usefulActions: r.total_actions ?? 0, // <-- avoid N+1; uses weekly_report.total_actions
          summarySnippet: snippet,
        };
      });

      // In-memory search on q (name + snippet)
      const qLower = q.toLowerCase();
      const filtered = q
        ? rows.filter(
            (r) =>
              r.userName.toLowerCase().includes(qLower) ||
              (r.summarySnippet ?? "").toLowerCase().includes(qLower),
          )
        : rows;

      return NextResponse.json(
        { rows: filtered, total: count ?? filtered.length, page, pageSize },
        { status: 200 },
      );
    }

    // Fallback: userName sort → fetch a reasonable window, filter & sort in-memory
    const { data: allRaw, error: allErr } = await base.limit(2000);
    if (allErr)
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 },
      );

    const reports = (allRaw as WeeklyReport[]) ?? [];
    let rows: FeedRow[] = reports.map((r) => {
      const wsIso = `${r.week_start}T00:00:00.000Z`;
      const weIso = `${melDateOnly(addDays(new Date(`${r.week_start}T00:00:00`), 6))}T23:59:59.999Z`;

      let snippet: string | null = null;
      try {
        if (r.project_time && Object.keys(r.project_time).length) {
          const top = Object.entries(r.project_time)
            .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${Math.round((v ?? 0) / 60)}h`)
            .join(", ");
          if (top) snippet = `Focus: ${top}`;
        } else if (r.daily_stats) {
          const text = JSON.stringify(r.daily_stats);
          const cleaned = text.replace(/["{}]/g, "");
          snippet = cleaned.slice(0, 140) || null;
        }
      } catch {
        /* ignore */
      }

      return {
        reportId: r.report_id,
        userId: r.user_id,
        userName: nameById.get(r.user_id) ?? "Unknown",
        weekStart: wsIso,
        weekEnd: weIso,
        publishedAt: new Date(r.created_at).toISOString(),
        usefulActions: r.total_actions ?? 0,
        summarySnippet: snippet,
      };
    });

    // Search
    const qLower = q.toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.userName.toLowerCase().includes(qLower) ||
          (r.summarySnippet ?? "").toLowerCase().includes(qLower),
      );
    }

    // Sort by userName in memory
    rows.sort((a, b) =>
      sortDir === "asc"
        ? a.userName.localeCompare(b.userName)
        : b.userName.localeCompare(a.userName),
    );

    // Paginate in memory
    const total = rows.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageRows = rows.slice(start, end);

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
