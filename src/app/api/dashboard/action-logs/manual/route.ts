import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// POST - Create manual action log entry
export async function POST(request: Request) {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const { data: user, error: userError } = await supabaseAdmin
      .from("user_account")
      .select("user_id")
      .eq("clerk_id", authContext.userId)
      .is("deleted_at", null)
      .single();

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, toolId, eventTime, minutes } = body;

    // Validate required fields
    if (!title || !eventTime || !minutes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create the activity log entry
    const { data: activity, error: insertError } = await supabaseAdmin
      .from("activity_log")
      .insert({
        user_id: user.user_id,
        tool_id: toolId || null,
        template_id: null,
        event_time: eventTime,
        minutes: parseInt(minutes),
        title,
        metadata: { manual: true, showInReport: true },
        status: "completed",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating manual entry:", insertError);
      return NextResponse.json(
        { error: "Failed to create action log" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Action log created successfully",
        activity,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating manual action log:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
