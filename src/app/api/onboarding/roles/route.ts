import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const department = searchParams.get("department");

    if (!department) {
      return NextResponse.json(
        { error: "Department is required" },
        { status: 400 },
      );
    }

    // Fetch roles for the given department
    const { data, error } = await supabaseAdmin
      .from("role")
      .select("role_id, name, department")
      .eq("department", department)
      .order("name");

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch roles" },
        { status: 500 },
      );
    }

    return NextResponse.json({ roles: data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
