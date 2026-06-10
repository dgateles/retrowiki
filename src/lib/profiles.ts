import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, articles } from "@/db/schema";

export type Profile = {
  id: number;
  handle: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  reputation: number;
  createdAt: Date;
  lastSeenAt: Date | null;
  articles: { id: number; slug: string; title: string; type: string }[];
};

export async function getProfile(handle: string): Promise<Profile | null> {
  try {
    const [user] = await db
      .select({
        id: users.id,
        handle: users.handle,
        displayName: users.displayName,
        role: users.role,
        avatarUrl: users.avatarUrl,
        coverUrl: users.coverUrl,
        reputation: users.reputation,
        createdAt: users.createdAt,
        lastSeenAt: users.lastSeenAt,
      })
      .from(users)
      .where(eq(users.handle, handle.toLowerCase()))
      .limit(1);
    if (!user) return null;

    const arts = await db
      .select({ id: articles.id, slug: articles.slug, title: articles.title, type: articles.type })
      .from(articles)
      .where(and(eq(articles.authorId, user.id), eq(articles.status, "published")))
      .orderBy(desc(articles.publishedAt))
      .limit(60);

    return { ...user, articles: arts };
  } catch {
    return null;
  }
}
