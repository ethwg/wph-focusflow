import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// GET - Fetch weekly overview data
export async function GET(request: Request) {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get weekOffset from query params
    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0");

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

    // Calculate the start of the target week (Monday) with offset
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysToMonday + weekOffset * 7);
    startOfWeek.setHours(0, 0, 0, 0);

    // Calculate the end of the target week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Fetch activity logs for the target week
    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from("activity_log")
      .select("event_time, minutes, status")
      .eq("user_id", user.user_id)
      .gte("event_time", startOfWeek.toISOString())
      .lte("event_time", endOfWeek.toISOString())
      .order("event_time", { ascending: true });

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError);
      return NextResponse.json(
        { error: "Failed to fetch activities" },
        { status: 500 },
      );
    }

    // Initialize data structure for all 7 days of the week
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dailyData: {
      [key: string]: { actions: number; minutes: number };
    } = {};

    weekDays.forEach((day) => {
      dailyData[day] = { actions: 0, minutes: 0 };
    });

    // Aggregate activities by day
    activities?.forEach((activity) => {
      const activityDate = new Date(activity.event_time);
      const dayIndex = activityDate.getDay();
      const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      const dayName = weekDays[adjustedDayIndex];

      dailyData[dayName].actions += 1;
      dailyData[dayName].minutes += activity.minutes || 0;
    });

    // Format data for the chart
    const chartData = weekDays.map((day) => ({
      day,
      actions: dailyData[day].actions,
      minutes: dailyData[day].minutes,
    }));

    // Calculate summary statistics
    const totalActions = chartData.reduce((sum, day) => sum + day.actions, 0);
    const totalMinutes = chartData.reduce((sum, day) => sum + day.minutes, 0);
    const averageActionsPerDay = totalActions / 7;
    const averageMinutesPerDay = totalMinutes / 7;

    return NextResponse.json(
      {
        chartData,
        summary: {
          totalActions,
          totalMinutes,
          totalHours: Math.round((totalMinutes / 60) * 10) / 10,
          averageActionsPerDay: Math.round(averageActionsPerDay * 10) / 10,
          averageMinutesPerDay: Math.round(averageMinutesPerDay),
          weekStart: startOfWeek.toISOString(),
          weekEnd: endOfWeek.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching weekly overview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
