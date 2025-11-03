import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

interface User {
  user_id: number;
}

interface Tool {
  tool_id: number;
  name: string;
  category: string | null;
}

interface Template {
  display_name: string;
  action_type: string;
}

interface ActivityMetadata {
  showInReport?: boolean;
  [key: string]: unknown;
}

interface ActivityLog {
  log_id: number;
  title: string | null;
  event_time: string;
  minutes: number | null;
  status: string | null;
  metadata: ActivityMetadata | null;
  tool: Tool | Tool[] | null;
  template: Template | Template[] | null;
}

interface UpdateActivityRequest {
  logId: number;
  showInReport: boolean;
}

interface ActivityWithMetadata {
  metadata: ActivityMetadata | null;
}

// GET - Fetch action logs with search, sort, filter, and pagination
export async function GET(request: Request) {
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

    const typedUser = user as User | null;

    if (userError || !typedUser) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "event_time";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const toolFilter = searchParams.get("tool") || "";
    const statusFilter = searchParams.get("status") || "";

    // Calculate pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build base query
    let query = supabaseAdmin
      .from("activity_log")
      .select(
        `
        log_id,
        title,
        event_time,
        minutes,
        status,
        metadata,
        tool:tool_id (
          tool_id,
          name,
          category
        ),
        template:template_id (
          display_name,
          action_type
        )
      `,
        { count: "exact" },
      )
      .eq("user_id", typedUser.user_id);

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%`);
    }

    // Apply tool filter
    if (toolFilter && toolFilter !== "all") {
      query = query.eq("tool_id", parseInt(toolFilter));
    }

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    // Apply sorting
    const ascending = sortOrder === "asc";
    query = query.order(sortBy, { ascending });

    // Apply pagination
    query = query.range(from, to);

    const { data: activities, error: activitiesError, count } = await query;

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError);
      return NextResponse.json(
        { error: "Failed to fetch activities" },
        { status: 500 },
      );
    }

    const typedActivities = (activities as ActivityLog[]) || [];

    // Format the activities
    const formattedActivities = typedActivities.map((activity) => {
      const eventDate = new Date(activity.event_time);
      const dateString = eventDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const timeString = eventDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const tool = Array.isArray(activity.tool)
        ? activity.tool[0]
        : activity.tool;
      const template = Array.isArray(activity.template)
        ? activity.template[0]
        : activity.template;

      // Check if activity is marked to show in report
      const metadata = activity.metadata;
      const showInReport = metadata?.showInReport !== false; // Default to true

      return {
        logId: activity.log_id,
        date: dateString,
        time: timeString,
        dateTime: activity.event_time,
        tool: tool?.name || "Unknown",
        toolId: tool?.tool_id || null,
        toolCategory: tool?.category || null,
        actionDescription:
          activity.title || template?.display_name || "No description",
        minutes: activity.minutes || 0,
        status: activity.status,
        showInReport,
      };
    });

    // Get unique tools for filter dropdown
    const { data: tools, error: toolsError } = await supabaseAdmin
      .from("tool")
      .select("tool_id, name")
      .eq("active", true)
      .order("name");

    if (toolsError) {
      console.error("Error fetching tools:", toolsError);
    }

    const typedTools = (tools as Pick<Tool, "tool_id" | "name">[]) || [];

    return NextResponse.json(
      {
        activities: formattedActivities,
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
        filters: {
          tools: typedTools,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching action logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update show in report status
export async function PATCH(request: Request) {
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

    const typedUser = user as User | null;

    if (userError || !typedUser) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json()) as UpdateActivityRequest;
    const { logId, showInReport } = body;

    if (!logId || typeof showInReport !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Get current metadata
    const { data: activity, error: fetchError } = await supabaseAdmin
      .from("activity_log")
      .select("metadata")
      .eq("log_id", logId)
      .eq("user_id", typedUser.user_id)
      .single();

    const typedActivity = activity as ActivityWithMetadata | null;

    if (fetchError || !typedActivity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 },
      );
    }

    // Update metadata
    const currentMetadata = typedActivity.metadata || {};
    const updatedMetadata: ActivityMetadata = {
      ...currentMetadata,
      showInReport,
    };

    const { error: updateError } = await supabaseAdmin
      .from("activity_log")
      .update({ metadata: updatedMetadata })
      .eq("log_id", logId)
      .eq("user_id", typedUser.user_id);

    if (updateError) {
      console.error("Error updating activity:", updateError);
      return NextResponse.json(
        { error: "Failed to update activity" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Activity updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
