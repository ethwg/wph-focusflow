import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

interface PrivacySettings {
  [key: string]: unknown;
}

interface ToolConnections {
  [key: string]: unknown;
}

interface UserProfile {
  user_id: number;
  org_id: number;
  team_id: number | null;
  role_id: number | null;
  email: string;
  name: string;
  timezone: string | null;
  privacy_settings: PrivacySettings;
  tool_connections: ToolConnections;
  tracking_enabled: boolean;
  last_login: string | null;
  created_at: string;
}

interface UpdateUserProfileRequest {
  timezone?: string | null;
  privacy_settings?: PrivacySettings;
  tracking_enabled?: boolean;
}

interface ProfileUpdateData {
  timezone?: string | null;
  privacy_settings?: PrivacySettings;
  tracking_enabled?: boolean;
}

// GET - Fetch current user's profile
export async function GET() {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user data from Supabase using clerk_id
    const { data, error } = await supabaseAdmin
      .from("user_account")
      .select(
        `
        user_id,
        org_id,
        team_id,
        role_id,
        email,
        name,
        timezone,
        privacy_settings,
        tool_connections,
        tracking_enabled,
        last_login,
        created_at
      `,
      )
      .eq("clerk_id", authContext.userId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 },
      );
    }

    const typedData = data as UserProfile;

    return NextResponse.json(
      {
        user: typedData,
        isAdmin: authContext.isAdmin,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update current user's profile settings
export async function PATCH(request: NextRequest) {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as UpdateUserProfileRequest;
    const { timezone, privacy_settings, tracking_enabled } = body;

    // Build update object with only allowed fields
    // Note: name and email are NOT included here as they're handled by Clerk webhooks
    const updateData: ProfileUpdateData = {};

    if (timezone !== undefined) {
      updateData.timezone = timezone;
    }

    if (privacy_settings !== undefined) {
      updateData.privacy_settings = privacy_settings;
    }

    if (tracking_enabled !== undefined) {
      updateData.tracking_enabled = tracking_enabled;
    }

    // Don't allow empty updates
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
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
        { error: "Failed to update user profile" },
        { status: 400 },
      );
    }

    const typedData = data as UserProfile;

    return NextResponse.json({ user: typedData }, { status: 200 });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
