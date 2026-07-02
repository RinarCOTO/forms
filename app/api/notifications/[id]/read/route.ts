import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/services/user.service";
import { markNotificationAsRead } from "@/lib/notifications";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const notificationId = Number(params.id);
    if (!Number.isInteger(notificationId)) {
      return NextResponse.json({ error: "Invalid notification id" }, { status: 400 });
    }

    const notification = await markNotificationAsRead(user.userId, notificationId);
    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("PATCH /api/notifications/[id]/read error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
