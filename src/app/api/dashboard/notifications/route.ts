import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth-helpers";

// GET - Fetch user notifications
export async function GET(request: NextRequest) {
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

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build query
    let query = supabaseAdmin
      .from("notification")
      .select("notification_id, type, message, data, read, created_at")
      .eq("user_id", user.user_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    const { data: notifications, error: notificationsError } = await query;

    if (notificationsError) {
      console.error("Error fetching notifications:", notificationsError);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 },
      );
    }

    // Format notifications
    const formattedNotifications =
      notifications?.map((notification) => {
        const createdAt = new Date(notification.created_at);
        const now = new Date();
        const diffInMs = now.getTime() - createdAt.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        let timeAgo = "";
        if (diffInDays > 0) {
          timeAgo = `${diffInDays}d ago`;
        } else if (diffInHours > 0) {
          timeAgo = `${diffInHours}h ago`;
        } else if (diffInMinutes > 0) {
          timeAgo = `${diffInMinutes}m ago`;
        } else {
          timeAgo = "Just now";
        }

        return {
          id: notification.notification_id,
          type: notification.type,
          message: notification.message,
          data: notification.data,
          read: notification.read,
          timeAgo,
          createdAt: notification.created_at,
        };
      }) || [];

    const unreadCount = notifications?.filter((n) => !n.read).length || 0;

    return NextResponse.json(
      {
        notifications: formattedNotifications,
        unreadCount,
        totalCount: formattedNotifications.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user (the sender)
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("user_account")
      .select("user_id, name")
      .eq("clerk_id", authContext.userId)
      .is("deleted_at", null)
      .single();

    if (userError || !currentUser) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { userId, type, message, data } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 },
      );
    }

    // Verify target user exists
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from("user_account")
      .select("user_id")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 },
      );
    }

    // Create the notification
    const { data: notification, error: createError } = await supabaseAdmin
      .from("notification")
      .insert({
        user_id: userId,
        type: type,
        message: message,
        data: data || {},
        read: false,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating notification:", createError);
      return NextResponse.json(
        { error: "Failed to create notification" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Notification created successfully",
        notification,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
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
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      // Mark all notifications as read
      const { error: updateError } = await supabaseAdmin
        .from("notification")
        .update({ read: true })
        .eq("user_id", user.user_id)
        .eq("read", false);

      if (updateError) {
        console.error("Error marking all as read:", updateError);
        return NextResponse.json(
          { error: "Failed to mark all as read" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { message: "All notifications marked as read" },
        { status: 200 },
      );
    } else if (notificationId) {
      // Mark single notification as read
      const { error: updateError } = await supabaseAdmin
        .from("notification")
        .update({ read: true })
        .eq("notification_id", notificationId)
        .eq("user_id", user.user_id);

      if (updateError) {
        console.error("Error marking notification as read:", updateError);
        return NextResponse.json(
          { error: "Failed to mark notification as read" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { message: "Notification marked as read" },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete notification(s)
export async function DELETE(request: NextRequest) {
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
    const { notificationId, deleteAll } = body;

    if (deleteAll) {
      // Delete all notifications for the user
      const { error: deleteError } = await supabaseAdmin
        .from("notification")
        .delete()
        .eq("user_id", user.user_id);

      if (deleteError) {
        console.error("Error deleting all notifications:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete all notifications" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { message: "All notifications deleted" },
        { status: 200 },
      );
    } else if (notificationId) {
      // Delete single notification
      const { error: deleteError } = await supabaseAdmin
        .from("notification")
        .delete()
        .eq("notification_id", notificationId)
        .eq("user_id", user.user_id);

      if (deleteError) {
        console.error("Error deleting notification:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete notification" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { message: "Notification deleted" },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// OPTIONS - Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: "GET, POST, PATCH, DELETE, OPTIONS",
    },
  });
}
