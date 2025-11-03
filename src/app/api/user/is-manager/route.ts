import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// GET - Check if current user is a manager of any team
export async function GET() {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, get the user's user_id from clerk_id
    const { data: userData, error: userError } = await supabaseAdmin
      .from("user_account")
      .select("user_id")
      .eq("clerk_id", authContext.userId)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if this user_id is a manager of any team
    const { data: teams, error: teamError } = await supabaseAdmin
      .from("team")
      .select("team_id, name")
      .eq("manager_id", userData.user_id);

    if (teamError) {
      console.error("Error checking manager status:", teamError);
      return NextResponse.json(
        { error: "Failed to check manager status" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        isManager: teams && teams.length > 0,
        managedTeams: teams || [],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error checking manager status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
