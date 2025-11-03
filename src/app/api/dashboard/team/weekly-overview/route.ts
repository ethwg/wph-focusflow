// app/api/dashboard/team/weekly-overview/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // weekOffset: 0=current, -1=last, +1=future (usually disabled in UI)
    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0");

    // Current user
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("user_account")
      .select(
        `
        user_id,
        team_id,
        name,
        email,
        role:role_id ( name )
      `,
      )
      .eq("clerk_id", authContext.userId)
      .single();

    if (userError || !currentUser) {
      console.error("Error fetching current user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!currentUser.team_id) {
      return NextResponse.json(
        { error: "User is not part of any team" },
        { status: 404 },
      );
    }

    // Team & manager check
    const { data: team, error: teamError } = await supabaseAdmin
      .from("team")
      .select("manager_id, name")
      .eq("team_id", currentUser.team_id)
      .single();

    if (teamError || !team) {
      console.error("Error fetching team:", teamError);
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const isManager = team.manager_id === currentUser.user_id;
    if (!isManager) {
      return NextResponse.json(
        { error: "Access denied. Manager privileges required." },
        { status: 403 },
      );
    }

    // Team members
    const { data: teamMembers, error: membersError } = await supabaseAdmin
      .from("user_account")
      .select("user_id")
      .eq("team_id", currentUser.team_id)
      .is("deleted_at", null);

    if (membersError) {
      console.error("Error fetching team members:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch team members" },
        { status: 500 },
      );
    }

    const teamMemberIds = teamMembers?.map((m) => m.user_id) || [];
    if (teamMemberIds.length === 0) {
      return NextResponse.json(
        {
          chartData: [],
          tools: [],
          teamName: team.name,
          weekStart: null,
          weekEnd: null,
        },
        { status: 200 },
      );
    }

    // ----- Date ranges (Monday-based weeks), with offset -----
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Start of selected week (Mon)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysToMonday + weekOffset * 7);
    startOfWeek.setHours(0, 0, 0, 0);

    // End of selected week (Sun 23:59:59.999)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Previous week range
    const prevStart = new Date(startOfWeek);
    prevStart.setDate(startOfWeek.getDate() - 7);
    const prevEnd = new Date(endOfWeek);
    prevEnd.setDate(endOfWeek.getDate() - 7);

    // ----- Fetch activities -----
    const selectFields = `
      log_id,
      event_time,
      tool:tool_id ( tool_id, name )
    `;

    const [
      { data: selectedWeek, error: selectedErr },
      { data: previousWeek, error: prevErr },
    ] = await Promise.all([
      supabaseAdmin
        .from("activity_log")
        .select(selectFields)
        .in("user_id", teamMemberIds)
        .gte("event_time", startOfWeek.toISOString())
        .lte("event_time", endOfWeek.toISOString())
        .not("tool_id", "is", null),
      supabaseAdmin
        .from("activity_log")
        .select(selectFields)
        .in("user_id", teamMemberIds)
        .gte("event_time", prevStart.toISOString())
        .lte("event_time", prevEnd.toISOString())
        .not("tool_id", "is", null),
    ]);

    if (selectedErr || prevErr) {
      console.error("Error fetching team activities:", selectedErr || prevErr);
      return NextResponse.json(
        { error: "Failed to fetch team activities" },
        { status: 500 },
      );
    }

    // ----- Tools set -----
    const toolsSet = new Set<string>();
    selectedWeek?.forEach(
      // eslint-disable-next-line
      (a: any) => a.tool?.name && toolsSet.add(a.tool.name),
    );
    previousWeek?.forEach(
      // eslint-disable-next-line
      (a: any) => a.tool?.name && toolsSet.add(a.tool.name),
    );
    const tools = Array.from(toolsSet);

    // ----- Build Mon..Sun skeleton -----
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const chartData = days.map((day) => {
      const o: Record<string, number | string> = { day };
      tools.forEach((t) => {
        o[`${t}_current`] = 0;
        o[`${t}_last`] = 0;
      });
      return o;
    });

    // Helper: map JS date to Mon..Sun index (Mon=0)
    const toIndex = (d: Date) => {
      const di = d.getDay(); // 0..6 (Sun..Sat)
      return di === 0 ? 6 : di - 1;
    };

    // Count selected week
    // eslint-disable-next-line
    selectedWeek?.forEach((a: any) => {
      if (!a.tool?.name) return;
      const idx = toIndex(new Date(a.event_time));
      chartData[idx][`${a.tool.name}_current`] =
        (chartData[idx][`${a.tool.name}_current`] as number) + 1;
    });

    // Count previous week
    // eslint-disable-next-line
    previousWeek?.forEach((a: any) => {
      if (!a.tool?.name) return;
      const idx = toIndex(new Date(a.event_time));
      chartData[idx][`${a.tool.name}_last`] =
        (chartData[idx][`${a.tool.name}_last`] as number) + 1;
    });

    return NextResponse.json(
      {
        chartData,
        tools,
        teamName: team.name,
        weekStart: startOfWeek.toISOString(),
        weekEnd: endOfWeek.toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching team weekly overview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
