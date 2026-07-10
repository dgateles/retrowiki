import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userIgnores, users } from "@/db/schema";

/** IDs que o usuário ignora (para filtrar/recolher conteúdo). */
export async function getIgnoredUserIds(userId: number | null): Promise<number[]> {
  if (!userId) return [];
  try {
    const rows = await db.select({ id: userIgnores.ignoredId }).from(userIgnores).where(eq(userIgnores.userId, userId));
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}

export async function isIgnoring(userId: number | null, targetId: number): Promise<boolean> {
  if (!userId) return false;
  try {
    const [r] = await db.select({ id: userIgnores.id }).from(userIgnores)
      .where(and(eq(userIgnores.userId, userId), eq(userIgnores.ignoredId, targetId))).limit(1);
    return !!r;
  } catch {
    return false;
  }
}

export type IgnoredUser = { id: number; handle: string; displayName: string; avatarUrl: string | null };
export async function listIgnored(userId: number): Promise<IgnoredUser[]> {
  try {
    return await db
      .select({ id: users.id, handle: users.handle, displayName: users.displayName, avatarUrl: users.avatarUrl })
      .from(userIgnores)
      .innerJoin(users, eq(users.id, userIgnores.ignoredId))
      .where(eq(userIgnores.userId, userId));
  } catch {
    return [];
  }
}
