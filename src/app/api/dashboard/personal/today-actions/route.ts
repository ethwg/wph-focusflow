import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// GET - Fetch today's action logs
export async function GET() {
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

    // Calculate start and end of today
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch today's activity logs
    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from("activity_log")
      .select(
        `
        log_id,
        title,
        event_time,
        minutes,
        status,
        tool:tool_id (
          name,
          category
        ),
        template:template_id (
          display_name,
          action_type
        )
      `,
      )
      .eq("user_id", user.user_id)
      .gte("event_time", startOfDay.toISOString())
      .lte("event_time", endOfDay.toISOString())
      .order("event_time", { ascending: false })
      .limit(10);

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError);
      return NextResponse.json(
        { error: "Failed to fetch activities" },
        { status: 500 },
      );
    }

    // Format the activities
    const formattedActivities =
      activities?.map((activity) => {
        const activityTime = new Date(activity.event_time);
        const timeString = activityTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        // Extract tool/template info
        const tool = Array.isArray(activity.tool)
          ? activity.tool[0]
          : activity.tool;
        const template = Array.isArray(activity.template)
          ? activity.template[0]
          : activity.template;

        return {
          logId: activity.log_id,
          title: activity.title || template?.display_name || "Activity",
          time: timeString,
          minutes: activity.minutes || 0,
          status: activity.status,
          toolName: tool?.name || null,
          toolCategory: tool?.category || null,
          actionType: template?.action_type || null,
        };
      }) || [];

    // Calculate totals
    const totalActions = formattedActivities.length;
    const totalMinutes = formattedActivities.reduce(
      (sum, activity) => sum + activity.minutes,
      0,
    );

    return NextResponse.json(
      {
        hasActions: totalActions > 0,
        actions: formattedActivities,
        summary: {
          totalActions,
          totalMinutes,
          totalHours: Math.floor(totalMinutes / 60),
          remainingMinutes: totalMinutes % 60,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching today's actions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
