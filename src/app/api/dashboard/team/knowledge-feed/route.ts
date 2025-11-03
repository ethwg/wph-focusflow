// app/api/dashboard/team/knowledge-feed/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

type WeekPreset = "this" | "last" | "last4" | "all";

interface DisplayTemplate {
  display_name?: string;
}

interface ToolData {
  name?: string;
}

type JoinDisplay = DisplayTemplate | DisplayTemplate[] | null | undefined;
type JoinTool = ToolData | ToolData[] | null | undefined;

interface CurrentUser {
  user_id: number;
  team_id: number | null;
}

interface Team {
  team_id: number;
  name: string;
  manager_id: number | null;
}

interface TeamMember {
  user_id: number;
  name: string;
}

interface ActivityLog {
  user_id: number;
  event_time: string;
  minutes: number | null;
  title: string | null;
  template: JoinDisplay;
  tool: JoinTool;
}

interface WeeklyReport {
  user_id: number;
  week_start: string;
  total_actions: number | null;
  total_minutes: number | null;
  project_time: Record<string, number> | null;
  daily_stats: Record<string, unknown> | null;
  created_at: string;
  published: boolean;
}

interface TeamReport {
  week_start: string;
  ai_summary: string | null;
  team_stats: Record<string, unknown> | null;
  created_at: string;
}

interface N8nResponseWrapper {
  success?: boolean;
  output?: string;
  text?: string;
}

type Feed = {
  highlights: string[];
  insights: string[];
  recommendations: string[];
  workload_distribution: string[];
  sources: string[];
};

function mondayOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
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

function getDisplayName(t: JoinDisplay): string | null {
  if (!t) return null;
  if (Array.isArray(t)) return t[0]?.display_name ?? null;
  return t.display_name ?? null;
}

function getToolName(t: JoinTool): string | null {
  if (!t) return null;
  if (Array.isArray(t)) return t[0]?.name ?? null;
  return t.name ?? null;
}

function emptyFeed(): Feed {
  return {
    highlights: [],
    insights: [],
    recommendations: [],
    workload_distribution: [],
    sources: [],
  };
}

// Parse a JSON string potentially wrapped in code fences
function safeParseJsonString(s: string | null | undefined): unknown {
  if (!s || typeof s !== "string") return null;
  const trimmed = s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

// Coerce any upstream shape to a Feed object
function coerceToFeed(raw: unknown): Feed {
  const empty = emptyFeed();

  // n8n array shape: [{ success: boolean, output: "<json string>" }]
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0] as N8nResponseWrapper;
    const parsed = safeParseJsonString(first?.output) ?? first?.output ?? first;
    return coerceToFeed(parsed);
  }

  // object with output/text string
  if (raw && typeof raw === "object") {
    const r = raw as N8nResponseWrapper;
    if (typeof r.output === "string") {
      const parsed = safeParseJsonString(r.output);
      if (parsed) return coerceToFeed(parsed);
    }
    if (typeof r.text === "string") {
      const parsed = safeParseJsonString(r.text);
      if (parsed) return coerceToFeed(parsed);
    }
  }

  // already the final object
  if (raw && typeof raw === "object") {
    const r = raw as Partial<Feed>;
    return {
      highlights: Array.isArray(r.highlights) ? r.highlights : [],
      insights: Array.isArray(r.insights) ? r.insights : [],
      recommendations: Array.isArray(r.recommendations)
        ? r.recommendations
        : [],
      workload_distribution: Array.isArray(r.workload_distribution)
        ? r.workload_distribution
        : [],
      sources: Array.isArray(r.sources) ? r.sources : [],
    };
  }

  // raw JSON string
  if (typeof raw === "string") {
    const parsed = safeParseJsonString(raw);
    if (parsed) return coerceToFeed(parsed);
  }

  return empty;
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const weekPreset = (searchParams.get("weekPreset") || "this") as WeekPreset;

    // Current user -> team
    const { data: currentUser, error: userErr } = await supabaseAdmin
      .from("user_account")
      .select("user_id, team_id")
      .eq("clerk_id", auth.userId)
      .is("deleted_at", null)
      .single();

    const typedCurrentUser = currentUser as CurrentUser | null;

    if (userErr || !typedCurrentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!typedCurrentUser.team_id) {
      return NextResponse.json(
        { error: "User is not part of any team" },
        { status: 403 },
      );
    }

    // Team
    const { data: team, error: teamErr } = await supabaseAdmin
      .from("team")
      .select("team_id, name, manager_id")
      .eq("team_id", typedCurrentUser.team_id)
      .single();

    const typedTeam = team as Team | null;

    if (teamErr || !typedTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Members
    const { data: members, error: memErr } = await supabaseAdmin
      .from("user_account")
      .select("user_id, name")
      .eq("team_id", typedTeam.team_id)
      .is("deleted_at", null);
    if (memErr) {
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 },
      );
    }

    const typedMembers = (members as TeamMember[]) ?? [];
    const memberIds = typedMembers.map((m) => m.user_id);

    if (memberIds.length === 0) {
      return NextResponse.json(emptyFeed(), { status: 200 });
    }

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
    const s = startBound ? new Date(startBound) : null;
    const e = endBound ? new Date(endBound) : null;
    if (s) s.setHours(0, 0, 0, 0);
    if (e) e.setHours(23, 59, 59, 999);

    // Activity sample
    const { data: activities } = await supabaseAdmin
      .from("activity_log")
      .select(
        `
        user_id,
        event_time,
        minutes,
        title,
        template:template_id ( display_name ),
        tool:tool_id ( name )
      `,
      )
      .in("user_id", memberIds)
      .gte("event_time", s ? s.toISOString() : "1970-01-01T00:00:00.000Z")
      .lte("event_time", e ? e.toISOString() : new Date().toISOString())
      .order("event_time", { ascending: false })
      .limit(1000);

    const typedActivities = (activities as ActivityLog[]) ?? [];

    // Weekly reports (published)
    let wrQuery = supabaseAdmin
      .from("weekly_report")
      .select(
        "user_id, week_start, total_actions, total_minutes, project_time, daily_stats, created_at, published",
      )
      .in("user_id", memberIds)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(500);
    if (s && e) {
      wrQuery = wrQuery
        .gte("week_start", s.toISOString().slice(0, 10))
        .lte("week_start", e.toISOString().slice(0, 10));
    }
    const { data: reports } = await wrQuery;

    const typedReports = (reports as WeeklyReport[]) ?? [];

    // Optional team_report
    let trQuery = supabaseAdmin
      .from("team_report")
      .select("team_id, week_start, ai_summary, team_stats, created_at")
      .eq("team_id", typedTeam.team_id)
      .order("created_at", { ascending: false })
      .limit(8);
    if (s && e) {
      trQuery = trQuery
        .gte("week_start", s.toISOString().slice(0, 10))
        .lte("week_start", e.toISOString().slice(0, 10));
    }
    const { data: teamReports } = await trQuery;

    const typedTeamReports = (teamReports as TeamReport[]) ?? [];

    // Payload for n8n
    const payload = {
      team: {
        id: typedTeam.team_id,
        name: typedTeam.name,
        managerId: typedTeam.manager_id,
      },
      weekPreset,
      timeframe: {
        start: s ? s.toISOString() : null,
        end: e ? e.toISOString() : null,
        tz: "Australia/Melbourne",
      },
      members: typedMembers.map((m) => ({ id: m.user_id, name: m.name })),
      activitySample: typedActivities.map((a) => ({
        user_id: a.user_id,
        event_time: a.event_time,
        minutes: a.minutes ?? 0,
        title: a.title ?? null,
        template: getDisplayName(a.template),
        tool: getToolName(a.tool),
      })),
      weeklyReports: typedReports.map((r) => ({
        user_id: r.user_id,
        week_start: r.week_start,
        total_actions: r.total_actions,
        total_minutes: r.total_minutes,
        project_time: r.project_time,
        daily_stats: r.daily_stats,
        published_at: r.created_at,
      })),
      teamReports: typedTeamReports.map((tr) => ({
        week_start: tr.week_start,
        ai_summary: tr.ai_summary,
        team_stats: tr.team_stats,
        created_at: tr.created_at,
      })),
    };

    // Call n8n webhook (non-streaming)
    const base = process.env.N8N_WEBHOOK_URL; // e.g. https://wph-digital.app.n8n.cloud
    const apiKey = process.env.N8N_ADMIN_KEY;
    if (!base) {
      return NextResponse.json(
        { error: "Missing N8N_WEBHOOK_URL" },
        { status: 500 },
      );
    }
    const url = `${base.replace(/\/$/, "")}/webhook/team-knowledge-feed`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const txt = await upstream.text().catch(() => upstream.statusText);
      return NextResponse.json({ error: `n8n error: ${txt}` }, { status: 502 });
    }

    const ctype = upstream.headers.get("content-type") || "";
    let feed: Feed = emptyFeed();

    if (ctype.includes("application/json")) {
      const body = await upstream.json().catch(() => ({}));
      feed = coerceToFeed(body);
    } else {
      const rawText = await upstream.text().catch(() => "");
      feed = coerceToFeed(rawText);
    }

    return NextResponse.json(feed, { status: 200 });
  } catch (e) {
    console.error("knowledge-feed webhook error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
