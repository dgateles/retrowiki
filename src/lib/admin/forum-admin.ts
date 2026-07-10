import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { forumCategories, forums } from "@/db/schema";
import type { UserRole } from "@/db/schema";

export type AdminForum = {
  id: number; categoryId: number; title: string; slug: string; description: string | null; icon: string | null;
  visible: boolean; locked: boolean; minReadRole: UserRole; minPostRole: UserRole; sortOrder: number;
  topicsCount: number; postsCount: number;
};
export type AdminForumCategory = {
  id: number; title: string; description: string | null; visible: boolean; sortOrder: number; forums: AdminForum[];
};

export async function getForumAdminData(): Promise<AdminForumCategory[]> {
  try {
    const cats = await db.select().from(forumCategories).orderBy(asc(forumCategories.sortOrder), asc(forumCategories.id));
    const fs = await db.select().from(forums).orderBy(asc(forums.sortOrder), asc(forums.id));
    return cats.map((c) => ({
      id: c.id, title: c.title, description: c.description, visible: c.visible, sortOrder: c.sortOrder,
      forums: fs.filter((f) => f.categoryId === c.id).map((f) => ({
        id: f.id, categoryId: f.categoryId, title: f.title, slug: f.slug, description: f.description, icon: f.icon,
        visible: f.visible, locked: f.locked, minReadRole: f.minReadRole, minPostRole: f.minPostRole, sortOrder: f.sortOrder,
        topicsCount: f.topicsCount, postsCount: f.postsCount,
      })),
    }));
  } catch {
    return [];
  }
}
