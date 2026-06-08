import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function getUnreadCount(userId: number): Promise<number> {
  try {
    const rows = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.recipientId, userId), isNull(notifications.readAt)))
      .limit(50);
    return rows.length;
  } catch {
    return 0;
  }
}

export type NotificationItem = {
  id: number;
  type: string;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
};

export async function listNotifications(userId: number): Promise<NotificationItem[]> {
  try {
    return await db
      .select({
        id: notifications.id,
        type: notifications.type,
        payload: notifications.payload,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.recipientId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  } catch {
    return [];
  }
}

export async function markAllRead(userId: number): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.recipientId, userId), isNull(notifications.readAt)))
    .catch(() => {});
}
