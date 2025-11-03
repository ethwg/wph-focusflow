import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// GET - Fetch the latest AI-powered daily summary
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

    // Fetch the most recent daily summary with AI content
    const { data: summary, error: summaryError } = await supabaseAdmin
      .from("daily_summary")
      .select(
        "summary_id, summary_date, ai_summary, total_actions, total_minutes, created_at",
      )
      .eq("user_id", user.user_id)
      .not("ai_summary", "is", null)
      .order("summary_date", { ascending: false })
      .limit(1)
      .single();

    if (summaryError) {
      if (summaryError.code === "PGRST116") {
        // No summaries found
        return NextResponse.json(
          {
            hasSummary: false,
          },
          { status: 200 },
        );
      }
      console.error("Error fetching summary:", summaryError);
      return NextResponse.json(
        { error: "Failed to fetch summary" },
        { status: 500 },
      );
    }

    // Format the date
    const summaryDate = new Date(summary.summary_date);
    const formattedDate = summaryDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Calculate time ago
    const now = new Date();
    const diffInMs = now.getTime() - new Date(summary.created_at).getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    let timeAgo = "";
    if (diffInDays > 0) {
      timeAgo = `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else if (diffInHours > 0) {
      timeAgo = `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else {
      timeAgo = "Today";
    }

    return NextResponse.json(
      {
        hasSummary: true,
        summary: {
          summaryId: summary.summary_id,
          summaryDate: formattedDate,
          aiSummary: summary.ai_summary,
          totalActions: summary.total_actions,
          totalMinutes: summary.total_minutes,
          timeAgo,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching AI summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
