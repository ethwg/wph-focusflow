import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// GET - Fetch useful actions logged for current week
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

    // Calculate the end of the current week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Count activity logs for the current week
    const { count, error: countError } = await supabaseAdmin
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.user_id)
      .gte("event_time", startOfWeek.toISOString())
      .lte("event_time", endOfWeek.toISOString());

    if (countError) {
      console.error("Error counting activities:", countError);
      return NextResponse.json(
        { error: "Failed to fetch actions count" },
        { status: 500 },
      );
    }

    // Fetch previous week's count for comparison
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfWeek);
    endOfLastWeek.setDate(startOfWeek.getDate() - 1);
    endOfLastWeek.setHours(23, 59, 59, 999);

    const { count: lastWeekCount, error: lastWeekError } = await supabaseAdmin
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.user_id)
      .gte("event_time", startOfLastWeek.toISOString())
      .lte("event_time", endOfLastWeek.toISOString());

    if (lastWeekError) {
      console.error("Error counting last week activities:", lastWeekError);
    }

    // Calculate percentage change
    let percentageChange = 0;
    let trend: "up" | "down" | "neutral" = "neutral";

    if (lastWeekCount && lastWeekCount > 0) {
      percentageChange = Math.round(
        ((count! - lastWeekCount) / lastWeekCount) * 100,
      );
      trend =
        percentageChange > 0 ? "up" : percentageChange < 0 ? "down" : "neutral";
    } else if (count && count > 0) {
      trend = "up";
    }

    return NextResponse.json(
      {
        totalActions: count || 0,
        lastWeekActions: lastWeekCount || 0,
        percentageChange: Math.abs(percentageChange),
        trend,
        weekStart: startOfWeek.toISOString(),
        weekEnd: endOfWeek.toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching useful actions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
