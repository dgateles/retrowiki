import "server-only";
import { asc, count } from "drizzle-orm";
import { db } from "@/db";
import { ranks, users } from "@/db/schema";
import { DEFAULT_TIERS, rankForTiers, type Rank, type Tier } from "@/lib/ranks";

export type RankRow = { id: number; title: string; points: number; icon: string; image: string | null; sortOrder: number };

/** Semeia a tabela `ranks` com os tiers padrão se estiver vazia. */
export async function ensureRankSeed(): Promise<void> {
  try {
    const [row] = await db.select({ n: count() }).from(ranks);
    if ((row?.n ?? 0) > 0) return;
    await db.insert(ranks).values(DEFAULT_TIERS.map((t, i) => ({ title: t.label, points: t.at, icon: t.icon, sortOrder: i })));
  } catch {
    // ignora
  }
}

export async function getRankRows(): Promise<RankRow[]> {
  try {
    await ensureRankSeed();
    return await db.select().from(ranks).orderBy(asc(ranks.points), asc(ranks.sortOrder));
  } catch {
    return DEFAULT_TIERS.map((t, i) => ({ id: -(i + 1), title: t.label, points: t.at, icon: t.icon, image: null, sortOrder: i }));
  }
}

/** Tiers a partir do banco (com fallback aos padrões), para `rankForTiers`. */
export async function getRankTierList(): Promise<Tier[]> {
  const rows = await getRankRows();
  if (rows.length === 0) return DEFAULT_TIERS;
  return rows.map((r) => ({ label: r.title, at: r.points, icon: r.icon }));
}

/** Rank de uma reputação, usando os tiers do banco. */
export async function getRankForReputation(reputation: number): Promise<Rank> {
  return rankForTiers(reputation, await getRankTierList());
}

/** Contagem de membros em cada rank (faixa [pontos, próximo)). */
export async function getRankMemberCounts(rows: RankRow[]): Promise<Record<number, number>> {
  const counts: Record<number, number> = {};
  for (const r of rows) counts[r.id] = 0;
  try {
    const reps = await db.select({ reputation: users.reputation }).from(users);
    const sorted = [...rows].sort((a, b) => a.points - b.points);
    for (const u of reps) {
      const rep = Math.max(0, u.reputation ?? 0);
      let pick = sorted[0];
      for (const r of sorted) if (rep >= r.points) pick = r;
      if (pick) counts[pick.id] = (counts[pick.id] ?? 0) + 1;
    }
  } catch {
    // ignora
  }
  return counts;
}
