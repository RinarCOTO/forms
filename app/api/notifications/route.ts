import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/services/user.service";
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
} from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 50);

    const [notifications, unreadCount] = await Promise.all([
      getNotificationsForUser(user.userId, limit),
      getUnreadNotificationCount(user.userId),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await markAllNotificationsAsRead(user.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
