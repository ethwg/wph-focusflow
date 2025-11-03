import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// GET - Fetch recent weekly reports
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

    // Fetch recent weekly reports (limit to last 4)
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from("weekly_report")
      .select("report_id, week_start, total_actions, published, created_at")
      .eq("user_id", user.user_id)
      .order("week_start", { ascending: false })
      .limit(4);

    if (reportsError) {
      console.error("Error fetching reports:", reportsError);
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 },
      );
    }

    // Format the reports
    const formattedReports =
      reports?.map((report) => {
        const reportDate = new Date(report.week_start);
        const formattedDate = reportDate.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        // Calculate report due date (7 days after week_start)
        const dueDate = new Date(reportDate);
        dueDate.setDate(dueDate.getDate() + 7);
        const formattedDueDate = dueDate.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const formattedDueTime = dueDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        // Determine status
        let status = "";
        let statusDate = "";

        if (report.published) {
          const publishedDate = new Date(report.created_at);
          statusDate = publishedDate.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
          const publishedTime = publishedDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
          status = `Saved at ${statusDate} ${publishedTime}`;
        } else {
          const now = new Date();
          if (now > dueDate) {
            status = "Overdue";
          } else {
            status = "Save Hours";
          }
        }

        return {
          reportId: report.report_id,
          reportDate: formattedDate,
          actionsLogged: report.total_actions || 0,
          reportDue: `${formattedDueDate} ${formattedDueTime}`,
          status,
          published: report.published,
          isOverdue: !report.published && new Date() > dueDate,
        };
      }) || [];

    return NextResponse.json(
      {
        reports: formattedReports,
        totalReports: formattedReports.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching quick publish reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
