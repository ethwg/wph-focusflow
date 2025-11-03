import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, userIds, type, message, data } = body;

    // Get current user and verify they're a manager
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("user_account")
      .select("user_id, team_id")
      .eq("clerk_id", authContext.userId)
      .single();

    if (userError || !currentUser?.team_id) {
      return NextResponse.json(
        { error: "User not found or not in a team" },
        { status: 404 },
      );
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from("team")
      .select("manager_id")
      .eq("team_id", currentUser.team_id)
      .single();

    if (teamError || team?.manager_id !== currentUser.user_id) {
      return NextResponse.json(
        { error: "Only managers can send reminders" },
        { status: 403 },
      );
    }

    // Handle bulk or individual notification
    const targetUserIds = userIds || [userId];

    // Insert notifications for all target users
    const notifications = targetUserIds.map((id: number) => ({
      user_id: id,
      type: type || "daily_report_reminder",
      message:
        message ||
        "Your manager sent you a reminder to submit your daily report.",
      data: data || {
        reminderType: "daily_report",
        sentAt: new Date().toISOString(),
      },
    }));

    const { error: notificationError } = await supabaseAdmin
      .from("notification")
      .insert(notifications);

    if (notificationError) {
      console.error("Error creating notifications:", notificationError);
      return NextResponse.json(
        { error: "Failed to send reminder(s)" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: userIds
          ? `Reminders sent to ${userIds.length} team member(s)`
          : "Reminder sent successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending reminder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
