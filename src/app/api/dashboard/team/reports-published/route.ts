// app/api/dashboard/team/reports-published/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// GET - Fetch team reports published statistics for today
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

    // Only managers can view team-wide report statistics
    if (!isManager) {
      return NextResponse.json(
        { error: "Access denied. Manager privileges required." },
        { status: 403 },
      );
    }

    // Get today's date in ISO format (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0];

    // Get all team members (excluding deleted users)
    const { data: teamMembers, error: membersError } = await supabaseAdmin
      .from("user_account")
      .select("user_id, name")
      .eq("team_id", currentUser.team_id)
      .is("deleted_at", null);

    if (membersError) {
      console.error("Error fetching team members:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch team members" },
        { status: 500 },
      );
    }

    const totalMembers = teamMembers?.length || 0;

    // Get daily summaries submitted today for all team members
    const { data: dailySummaries, error: summariesError } = await supabaseAdmin
      .from("daily_summary")
      .select("user_id, submitted")
      .in("user_id", teamMembers?.map((m) => m.user_id) || [])
      .eq("summary_date", today)
      .eq("submitted", true);

    if (summariesError) {
      console.error("Error fetching daily summaries:", summariesError);
      return NextResponse.json(
        { error: "Failed to fetch daily summaries" },
        { status: 500 },
      );
    }

    const publishedCount = dailySummaries?.length || 0;

    return NextResponse.json(
      {
        publishedCount,
        totalMembers,
        date: today,
        teamName: team.name,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching team reports published:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
