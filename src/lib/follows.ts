import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { userFollows, users } from "@/db/schema";

/** IDs que o usuário segue (para o feed "Seguindo"). */
export async function getFollowedUserIds(userId: number | null): Promise<number[]> {
  if (!userId) return [];
  try {
    const rows = await db.select({ id: userFollows.followedId }).from(userFollows).where(eq(userFollows.followerId, userId));
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}

export async function isFollowing(userId: number | null, targetId: number): Promise<boolean> {
  if (!userId) return false;
  try {
    const [r] = await db.select({ id: userFollows.id }).from(userFollows)
      .where(and(eq(userFollows.followerId, userId), eq(userFollows.followedId, targetId))).limit(1);
    return !!r;
  } catch {
    return false;
  }
}

/** Contagem de seguidores e de quem o usuário segue. */
export async function getFollowCounts(userId: number): Promise<{ followers: number; following: number }> {
  try {
    const [[followers], [following]] = await Promise.all([
      db.select({ n: sql<number>`count(*)` }).from(userFollows).where(eq(userFollows.followedId, userId)),
      db.select({ n: sql<number>`count(*)` }).from(userFollows).where(eq(userFollows.followerId, userId)),
    ]);
    return { followers: Number(followers?.n ?? 0), following: Number(following?.n ?? 0) };
  } catch {
    return { followers: 0, following: 0 };
  }
}

export type FollowUser = { id: number; handle: string; displayName: string; avatarUrl: string | null };

/** Quem segue o usuário. */
export async function listFollowers(userId: number, limit = 100): Promise<FollowUser[]> {
  try {
    return await db
      .select({ id: users.id, handle: users.handle, displayName: users.displayName, avatarUrl: users.avatarUrl })
      .from(userFollows)
      .innerJoin(users, eq(users.id, userFollows.followerId))
      .where(eq(userFollows.followedId, userId))
      .limit(limit);
  } catch {
    return [];
  }
}

/** Quem o usuário segue. */
export async function listFollowing(userId: number, limit = 100): Promise<FollowUser[]> {
  try {
    return await db
      .select({ id: users.id, handle: users.handle, displayName: users.displayName, avatarUrl: users.avatarUrl })
      .from(userFollows)
      .innerJoin(users, eq(users.id, userFollows.followedId))
      .where(eq(userFollows.followerId, userId))
      .limit(limit);
  } catch {
    return [];
  }
}
