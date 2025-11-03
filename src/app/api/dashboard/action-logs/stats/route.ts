import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// GET - Fetch action log statistics
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

    // Calculate the start of the current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // 1. Total actions this week
    const { count: totalActions, error: countError } = await supabaseAdmin
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.user_id)
      .gte("event_time", startOfWeek.toISOString())
      .lte("event_time", endOfWeek.toISOString());

    if (countError) {
      console.error("Error counting actions:", countError);
    }

    // 2. Average actions per day (for this week)
    const daysElapsed = Math.ceil(
      (now.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24),
    );
    const averagePerDay = totalActions
      ? Math.round((totalActions / daysElapsed) * 10) / 10
      : 0;

    // 3. Top used tool
    const { data: toolUsage, error: toolError } = await supabaseAdmin
      .from("activity_log")
      .select(
        `
        tool_id,
        tool:tool_id (
          name
        )
      `,
      )
      .eq("user_id", user.user_id)
      .gte("event_time", startOfWeek.toISOString())
      .lte("event_time", endOfWeek.toISOString())
      .not("tool_id", "is", null);

    if (toolError) {
      console.error("Error fetching tool usage:", toolError);
    }

    // Count tool usage
    const toolCounts: { [key: string]: { name: string; count: number } } = {};
    toolUsage?.forEach((activity) => {
      const tool = Array.isArray(activity.tool)
        ? activity.tool[0]
        : activity.tool;

      if (tool && tool.name) {
        if (!toolCounts[tool.name]) {
          toolCounts[tool.name] = { name: tool.name, count: 0 };
        }
        toolCounts[tool.name].count += 1;
      }
    });

    // Find top tool
    let topTool = "N/A";
    let maxCount = 0;
    Object.values(toolCounts).forEach((tool) => {
      if (tool.count > maxCount) {
        maxCount = tool.count;
        topTool = tool.name;
      }
    });

    // 4. Longest streak of days with logged actions
    const { data: allActivities, error: streakError } = await supabaseAdmin
      .from("activity_log")
      .select("event_time")
      .eq("user_id", user.user_id)
      .order("event_time", { ascending: true });

    if (streakError) {
      console.error("Error fetching streak data:", streakError);
    }

    // Calculate longest streak
    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    const uniqueDates = new Set<string>();
    allActivities?.forEach((activity) => {
      const date = new Date(activity.event_time);
      const dateString = date.toISOString().split("T")[0];
      uniqueDates.add(dateString);
    });

    const sortedDates = Array.from(uniqueDates).sort();

    sortedDates.forEach((dateString) => {
      const currentDate = new Date(dateString);

      if (lastDate) {
        const diffInDays = Math.round(
          (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffInDays === 1) {
          currentStreak += 1;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      lastDate = currentDate;
    });

    longestStreak = Math.max(longestStreak, currentStreak);

    return NextResponse.json(
      {
        totalActionsThisWeek: totalActions || 0,
        averageActionsPerDay: averagePerDay,
        topUsedTool: topTool,
        longestStreakDays: longestStreak,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching action log stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
