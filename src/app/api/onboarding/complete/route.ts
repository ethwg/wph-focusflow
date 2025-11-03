import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

interface OnboardingRequest {
  roleId: number;
  toolIds?: number[];
  teamId?: number;
  orgId?: number;
}

interface UserUpdateData {
  role_id: number;
  tool_connections: number[];
  team_id?: number;
  org_id?: number;
}

interface UserAccount {
  user_id: number;
  org_id: number;
  team_id: number | null;
  role_id: number | null;
  email: string;
  name: string;
  timezone: string | null;
  privacy_settings: Record<string, unknown>;
  tool_connections: Record<string, unknown>;
  tracking_enabled: boolean;
  last_login: string | null;
  created_at: string;
}

interface Team {
  team_id: number;
  org_id: number;
  name: string;
  invite_code: string | null;
  members: number[] | Record<string, unknown>;
  manager_id: number | null;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as OnboardingRequest;
    const { roleId, toolIds, teamId, orgId } = body;

    if (!roleId) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Update user profile with onboarding data
    const updateData: UserUpdateData = {
      role_id: roleId,
      tool_connections: toolIds || [],
    };

    // If team is provided, set team and org
    if (teamId && orgId) {
      updateData.team_id = teamId;
      updateData.org_id = orgId;
    } else {
      // If no team, user might be creating their own org (handle later)
      // For now, set team_id and org_id to null or keep as -1
      updateData.team_id = -1;
      updateData.org_id = -1;
    }

    const { data, error } = await supabaseAdmin
      .from("user_account")
      .update(updateData)
      .eq("clerk_id", authContext.userId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to complete onboarding" },
        { status: 500 },
      );
    }

    const userData = data as UserAccount;

    // If user joined a team, add them to the team's members
    if (teamId && userData.user_id) {
      const { data: teamData, error: teamFetchError } = await supabaseAdmin
        .from("team")
        .select("members")
        .eq("team_id", teamId)
        .single();

      if (teamFetchError) {
        console.error("Error fetching team:", teamFetchError);
        // Don't fail the whole onboarding, just log the error
      } else {
        const typedTeam = teamData as Pick<Team, "members">;

        // Get current members array or initialize empty array
        const currentMembers = Array.isArray(typedTeam.members)
          ? (typedTeam.members as number[])
          : [];

        // Add user_id if not already in members
        if (!currentMembers.includes(userData.user_id)) {
          const updatedMembers = [...currentMembers, userData.user_id];

          const { error: teamUpdateError } = await supabaseAdmin
            .from("team")
            .update({ members: updatedMembers })
            .eq("team_id", teamId);

          if (teamUpdateError) {
            console.error("Error updating team members:", teamUpdateError);
          }
        }
      }
    }

    return NextResponse.json(
      { message: "Onboarding completed successfully", user: userData },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
