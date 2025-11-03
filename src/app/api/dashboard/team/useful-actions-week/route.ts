// app/api/dashboard/team/useful-actions-week/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// GET - Fetch team useful actions for this week with comparison to last week
export async function GET() {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's data
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("user_account")
      .select(
        `
        user_id,
        team_id,
        name,
        email,
        role:role_id (
          name
        )
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

    // Check if current user is a manager of their team
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

    // Only managers can view team-wide statistics
    if (!isManager) {
      return NextResponse.json(
        { error: "Access denied. Manager privileges required." },
        { status: 403 },
      );
    }

    // Get all team members (excluding deleted users)
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
          totalActions: 0,
          previousWeekActions: 0,
          percentageChange: 0,
          weekStart: null,
          teamName: team.name,
        },
        { status: 200 },
      );
    }

    // Calculate date ranges
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Days since last Monday

    // This week's Monday
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - daysToMonday);
    thisWeekStart.setHours(0, 0, 0, 0);

    // Last week's Monday
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    // Last week's Sunday
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setMilliseconds(-1);

    // Format dates for SQL
    const thisWeekStartStr = thisWeekStart.toISOString();
    const lastWeekStartStr = lastWeekStart.toISOString();
    const lastWeekEndStr = lastWeekEnd.toISOString();

    // Get this week's actions count
    const { count: thisWeekCount, error: thisWeekError } = await supabaseAdmin
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .in("user_id", teamMemberIds)
      .gte("event_time", thisWeekStartStr);

    if (thisWeekError) {
      console.error("Error fetching this week's actions:", thisWeekError);
      return NextResponse.json(
        { error: "Failed to fetch this week's actions" },
        { status: 500 },
      );
    }

    const totalActions = thisWeekCount || 0;

    // Get last week's actions count (full week: Monday to Sunday)
    const { count: lastWeekCount, error: lastWeekError } = await supabaseAdmin
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .in("user_id", teamMemberIds)
      .gte("event_time", lastWeekStartStr)
      .lte("event_time", lastWeekEndStr);

    if (lastWeekError) {
      console.error("Error fetching last week's actions:", lastWeekError);
      return NextResponse.json(
        { error: "Failed to fetch last week's actions" },
        { status: 500 },
      );
    }

    const previousWeekActions = lastWeekCount || 0;

    // Calculate percentage change
    let percentageChange = 0;
    if (previousWeekActions > 0) {
      percentageChange = Math.round(
        ((totalActions - previousWeekActions) / previousWeekActions) * 100,
      );
    } else if (totalActions > 0) {
      percentageChange = 100; // If no actions last week but some this week, 100% increase
    }

    return NextResponse.json(
      {
        totalActions,
        previousWeekActions,
        percentageChange,
        weekStart: thisWeekStart.toISOString().split("T")[0],
        teamName: team.name,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching team useful actions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
