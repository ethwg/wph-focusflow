import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all departments from role table, excluding role_id = -1
    const { data, error } = await supabaseAdmin
      .from("role")
      .select("department")
      .not("department", "is", null)
      .neq("role_id", -1)
      .order("department");

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch departments" },
        { status: 500 },
      );
    }

    // Get unique departments
    const uniqueDepartments = [...new Set(data.map((r) => r.department))];

    return NextResponse.json(
      { departments: uniqueDepartments },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
