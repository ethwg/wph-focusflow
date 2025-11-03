import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// Define color palette for projects
const PROJECT_COLORS = [
  "bg-primary",
  "bg-green-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-yellow-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-teal-500",
];

// GET - Fetch project time allocation for current week
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

    // Fetch activity logs for the current week
    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from("activity_log")
      .select("title, minutes, metadata")
      .eq("user_id", user.user_id)
      .gte("event_time", startOfWeek.toISOString())
      .lte("event_time", endOfWeek.toISOString());

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError);
      return NextResponse.json(
        { error: "Failed to fetch activities" },
        { status: 500 },
      );
    }

    // Aggregate time by project/title
    const projectTimeMap: { [key: string]: number } = {};

    activities?.forEach((activity) => {
      // Use metadata.project if available, otherwise use title, or "Uncategorized"
      let projectName = "Uncategorized";

      if (activity.metadata && typeof activity.metadata === "object") {
        const metadata = activity.metadata as { project?: string };
        if (metadata.project) {
          projectName = metadata.project;
        }
      }

      if (!projectName || projectName === "Uncategorized") {
        if (activity.title) {
          projectName = activity.title;
        }
      }

      if (!projectTimeMap[projectName]) {
        projectTimeMap[projectName] = 0;
      }

      projectTimeMap[projectName] += activity.minutes || 0;
    });

    // Convert to array and sort by time (descending)
    const projectAllocations = Object.entries(projectTimeMap)
      .map(([name, totalMinutes], index) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return {
          name,
          totalMinutes,
          time: `${hours}h ${minutes}mins`,
          hours,
          minutes,
          color: PROJECT_COLORS[index % PROJECT_COLORS.length],
        };
      })
      .sort((a, b) => b.totalMinutes - a.totalMinutes);

    // Calculate total time
    const totalMinutes = projectAllocations.reduce(
      (sum, project) => sum + project.totalMinutes,
      0,
    );
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = totalMinutes % 60;

    return NextResponse.json(
      {
        projects: projectAllocations,
        summary: {
          totalProjects: projectAllocations.length,
          totalMinutes,
          totalTime: `${totalHours}h ${totalMins}mins`,
          weekStart: startOfWeek.toISOString(),
          weekEnd: endOfWeek.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching project time allocation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
