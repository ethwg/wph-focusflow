// app/api/dashboard/team/name/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user (team_id + user_id for manager check)
    const { data: user, error: userErr } = await supabaseAdmin
      .from("user_account")
      .select("user_id, team_id")
      .eq("clerk_id", auth.userId)
      .is("deleted_at", null)
      .single();

    if (userErr || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.team_id) {
      return NextResponse.json(
        { error: "User is not part of any team" },
        { status: 404 },
      );
    }

    // Fetch team name and manager
    const { data: team, error: teamErr } = await supabaseAdmin
      .from("team")
      .select("name, manager_id")
      .eq("team_id", user.team_id)
      .single();

    if (teamErr || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        teamName: team.name,
        isManager: team.manager_id === user.user_id,
      },
      { status: 200 },
    );
  } catch (e) {
    console.error("team-name error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
