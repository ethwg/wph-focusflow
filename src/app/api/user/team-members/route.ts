// In your API route file
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// GET - Fetch team members (managers see all, members see only themselves)
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
      .select("manager_id, name, invite_code") // Added invite_code here
      .eq("team_id", currentUser.team_id)
      .single();

    if (teamError || !team) {
      console.error("Error fetching team:", teamError);
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const isManager = team.manager_id === currentUser.user_id;

    // If manager, fetch all team members; otherwise, only current user
    let teamMembers;
    if (isManager) {
      const { data, error } = await supabaseAdmin
        .from("user_account")
        .select(
          `
          user_id,
          name,
          email,
          role:role_id (
            name
          )
        `,
        )
        .eq("team_id", currentUser.team_id)
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching team members:", error);
        return NextResponse.json(
          { error: "Failed to fetch team members" },
          { status: 500 },
        );
      }

      teamMembers = data;
    } else {
      // Non-managers only see themselves
      teamMembers = [
        {
          user_id: currentUser.user_id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
        },
      ];
    }

    return NextResponse.json(
      {
        teamName: team.name,
        isManager,
        inviteCode: isManager ? team.invite_code : undefined, // Only include for managers
        members: teamMembers,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
