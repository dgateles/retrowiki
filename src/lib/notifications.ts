import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";

/** Cria uma notificação. Best-effort: nunca lança. */
export async function createNotification(recipientId: number, type: string, payload?: unknown): Promise<void> {
  try {
    await db.insert(notifications).values({ recipientId, type, payload: payload ?? null });
  } catch {
    // não bloquear o fluxo
  }
}

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

export async function listNotifications(
  userId: number,
  opts?: { unreadOnly?: boolean },
): Promise<NotificationItem[]> {
  try {
    const where = opts?.unreadOnly
      ? and(eq(notifications.recipientId, userId), isNull(notifications.readAt))
      : eq(notifications.recipientId, userId);
    return await db
      .select({
        id: notifications.id,
        type: notifications.type,
        payload: notifications.payload,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  } catch {
    return [];
  }
}

export async function markOneRead(userId: number, id: number): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.recipientId, userId), eq(notifications.id, id)))
    .catch(() => {});
}

export async function deleteOne(userId: number, id: number): Promise<void> {
  await db
    .delete(notifications)
    .where(and(eq(notifications.recipientId, userId), eq(notifications.id, id)))
    .catch(() => {});
}

export async function markAllRead(userId: number): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.recipientId, userId), isNull(notifications.readAt)))
    .catch(() => {});
}
