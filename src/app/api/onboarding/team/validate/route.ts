import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode || inviteCode.length !== 8) {
      return NextResponse.json(
        { error: "Invalid invite code format" },
        { status: 400 },
      );
    }

    // Find team by invite code
    const { data: team, error: teamError } = await supabaseAdmin
      .from("team")
      .select("team_id, name, org_id")
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: "Invalid invite code", valid: false },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        valid: true,
        team: {
          team_id: team.team_id,
          name: team.name,
          org_id: team.org_id,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error validating invite code:", error);
    return NextResponse.json(
      { error: "Internal server error", valid: false },
      { status: 500 },
    );
  }
}
