import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext, checkAdmin } from "@/lib/auth-helpers";

// GET - Fetch all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();

    // Check if user is authenticated and is admin
    if (!authContext || !checkAdmin(authContext)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    // Get query parameters for pagination and filtering
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
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
        tracking_enabled,
        last_login,
        created_at,
        clerk_id
      `,
        { count: "exact" },
      )
      .is("deleted_at", null) // Only active users
      .order("created_at", { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        users: data,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
