import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// Define the types for the query response
interface OrganizationData {
  name: string;
}

interface RoleData {
  name: string;
  department: string | null;
}

interface UserQueryResponse {
  user_id: number;
  name: string;
  email: string;
  tracking_enabled: boolean;
  organization: OrganizationData | OrganizationData[] | null;
  role: RoleData | RoleData[] | null;
}

// GET - Fetch user profile information for main welcome card
export async function GET() {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's complete profile with related data
    const { data: user, error: userError } = await supabaseAdmin
      .from("user_account")
      .select(
        `
        user_id,
        name,
        email,
        tracking_enabled,
        organization:org_id (
          name
        ),
        role:role_id (
          name,
          department
        )
      `,
      )
      .eq("clerk_id", authContext.userId)
      .is("deleted_at", null)
      .single();

    if (userError) {
      console.error("Error fetching user profile:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cast to our defined type
    const typedUser = user as unknown as UserQueryResponse;

    // Get initials from name
    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    // Helper functions to safely extract data
    const getOrganizationName = (
      org: OrganizationData | OrganizationData[] | null,
    ): string | null => {
      if (!org) return null;
      if (Array.isArray(org)) return org[0]?.name || null;
      return org.name || null;
    };

    const getRoleName = (role: RoleData | RoleData[] | null): string | null => {
      if (!role) return null;
      if (Array.isArray(role)) return role[0]?.name || null;
      return role.name || null;
    };

    const getDepartment = (
      role: RoleData | RoleData[] | null,
    ): string | null => {
      if (!role) return null;
      if (Array.isArray(role)) return role[0]?.department || null;
      return role.department || null;
    };

    // Format the response
    const profileData = {
      name: typedUser.name,
      initials: getInitials(typedUser.name),
      organization: getOrganizationName(typedUser.organization),
      department: getDepartment(typedUser.role),
      role: getRoleName(typedUser.role),
      trackingEnabled: typedUser.tracking_enabled,
    };

    return NextResponse.json(profileData, { status: 200 });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update tracking status
export async function PATCH(request: Request) {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { trackingEnabled } = body;

    if (typeof trackingEnabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid tracking status" },
        { status: 400 },
      );
    }

    // Update user's tracking status
    const { data, error } = await supabaseAdmin
      .from("user_account")
      .update({ tracking_enabled: trackingEnabled })
      .eq("clerk_id", authContext.userId)
      .is("deleted_at", null)
      .select("tracking_enabled")
      .single();

    if (error) {
      console.error("Error updating tracking status:", error);
      return NextResponse.json(
        { error: "Failed to update tracking status" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Tracking status updated successfully",
        trackingEnabled: data.tracking_enabled,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating tracking status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
