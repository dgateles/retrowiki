import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { announcements } from "@/db/schema";

export type Variant = "info" | "warning" | "success";
export type Announcement = { id: number; message: string; variant: Variant; linkUrl: string; linkLabel: string; active: boolean; createdAt: Date };

function rowTo(r: typeof announcements.$inferSelect): Announcement {
  return { id: r.id, message: r.message, variant: r.variant as Variant, linkUrl: r.linkUrl, linkLabel: r.linkLabel, active: r.active, createdAt: r.createdAt };
}

export async function listActiveAnnouncements(): Promise<Announcement[]> {
  try {
    const rows = await db.select().from(announcements).where(eq(announcements.active, true)).orderBy(desc(announcements.createdAt));
    return rows.map(rowTo);
  } catch {
    return [];
  }
}

export async function listAllAnnouncements(): Promise<Announcement[]> {
  try {
    const rows = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
    return rows.map(rowTo);
  } catch {
    return [];
  }
}

export type AnnouncementInput = { message: string; variant: Variant; linkUrl: string; linkLabel: string };

export async function createAnnouncement(input: AnnouncementInput, createdById: number): Promise<number | null> {
  try {
    const [res] = await db.insert(announcements).values({
      message: input.message.slice(0, 500),
      variant: input.variant,
      linkUrl: input.linkUrl.slice(0, 300),
      linkLabel: input.linkLabel.slice(0, 80),
      active: true,
      createdById,
    });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function setAnnouncementActive(id: number, active: boolean): Promise<boolean> {
  try {
    await db.update(announcements).set({ active }).where(eq(announcements.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deleteAnnouncement(id: number): Promise<boolean> {
  try {
    await db.delete(announcements).where(eq(announcements.id, id));
    return true;
  } catch {
    return false;
  }
}
