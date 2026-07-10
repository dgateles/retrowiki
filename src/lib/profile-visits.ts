import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { profileVisits, users } from "@/db/schema";

/** Registra (upsert) que `visitorId` visitou o perfil `profileId`. Best-effort. */
export async function recordProfileVisit(profileId: number, visitorId: number): Promise<void> {
  if (profileId === visitorId) return;
  try {
    const now = new Date();
    await db.insert(profileVisits).values({ profileId, visitorId, lastVisitAt: now })
      .onDuplicateKeyUpdate({ set: { lastVisitAt: now } });
  } catch {
    /* ignora */
  }
}

export type RecentVisitor = { id: number; handle: string; name: string; avatar: string | null; at: Date };
export async function listRecentVisitors(profileId: number, limit = 12): Promise<RecentVisitor[]> {
  try {
    return await db
      .select({ id: users.id, handle: users.handle, name: users.displayName, avatar: users.avatarUrl, at: profileVisits.lastVisitAt })
      .from(profileVisits)
      .innerJoin(users, eq(users.id, profileVisits.visitorId))
      .where(eq(profileVisits.profileId, profileId))
      .orderBy(desc(profileVisits.lastVisitAt))
      .limit(limit);
  } catch {
    return [];
  }
}
