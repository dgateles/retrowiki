import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { referrals, users } from "@/db/schema";

/** Registra uma indicação no cadastro. `ref` é o handle de quem indicou. */
export async function recordReferral(ref: string, referredId: number): Promise<void> {
  try {
    const handle = ref.trim().toLowerCase().replace(/^@/, "").slice(0, 50);
    if (!handle) return;
    const [referrer] = await db.select({ id: users.id }).from(users).where(eq(users.handle, handle)).limit(1);
    if (!referrer || referrer.id === referredId) return;
    await db.insert(referrals).values({ referrerId: referrer.id, referredId }).onDuplicateKeyUpdate({ set: { referrerId: referrer.id } });
    await db.update(users).set({ referredById: referrer.id }).where(eq(users.id, referredId));
  } catch {
    // best-effort: não bloquear o cadastro
  }
}

/** Quantas pessoas este membro indicou (que se cadastraram). */
export async function getReferralCount(userId: number): Promise<number> {
  try {
    const rows = await db.select({ id: referrals.id }).from(referrals).where(eq(referrals.referrerId, userId));
    return rows.length;
  } catch {
    return 0;
  }
}

export type ReferrerRow = { id: number; name: string; handle: string; count: number };

/** Ranking de quem mais indicou (admin). */
export async function listTopReferrers(limit = 50): Promise<ReferrerRow[]> {
  try {
    const rows = await db
      .select({ id: users.id, name: users.displayName, handle: users.handle, count: sql<number>`COUNT(${referrals.id})` })
      .from(referrals)
      .innerJoin(users, eq(users.id, referrals.referrerId))
      .groupBy(users.id, users.displayName, users.handle)
      .orderBy(desc(sql`COUNT(${referrals.id})`))
      .limit(limit);
    return rows.map((r) => ({ id: r.id, name: r.name, handle: r.handle, count: Number(r.count) }));
  } catch {
    return [];
  }
}

export async function getTotalReferrals(): Promise<number> {
  try {
    const rows = await db.select({ id: referrals.id }).from(referrals);
    return rows.length;
  } catch {
    return 0;
  }
}
