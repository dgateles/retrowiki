import "server-only";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { reactions, votes } from "@/db/schema";

export type Reaction = {
  id: number;
  name: string;
  emoji: string;
  weight: number;
  enabled: boolean;
  sortOrder: number;
};

const DEFAULTS: Omit<Reaction, "id">[] = [
  { name: "Curtir", emoji: "👍", weight: 1, enabled: true, sortOrder: 1 },
  { name: "Valeu", emoji: "🙏", weight: 1, enabled: true, sortOrder: 2 },
  { name: "Top", emoji: "🔥", weight: 1, enabled: true, sortOrder: 3 },
  { name: "Haha", emoji: "😄", weight: 0, enabled: true, sortOrder: 4 },
  { name: "Uau", emoji: "😮", weight: 0, enabled: true, sortOrder: 5 },
];

let seeded = false;

export async function ensureReactions(): Promise<void> {
  if (seeded) return;
  try {
    const [row] = await db.select({ id: reactions.id }).from(reactions).limit(1);
    if (!row) await db.insert(reactions).values(DEFAULTS);
    seeded = true;
  } catch {
    // ignora; tabela pode não existir em ambientes parciais
  }
}

export async function listReactions(): Promise<Reaction[]> {
  await ensureReactions();
  try {
    return await db.select().from(reactions).orderBy(asc(reactions.sortOrder), asc(reactions.id));
  } catch {
    return [];
  }
}

export async function listEnabledReactions(): Promise<Reaction[]> {
  const all = await listReactions();
  return all.filter((r) => r.enabled);
}

export async function getReaction(id: number): Promise<Reaction | null> {
  try {
    const [r] = await db.select().from(reactions).where(eq(reactions.id, id)).limit(1);
    return r ?? null;
  } catch {
    return null;
  }
}

/** Contagem de cada reação num artigo. reactionId null (legado) conta como a 1ª. */
export async function getReactionCounts(articleId: number, fallbackId: number | null): Promise<Map<number, number>> {
  const out = new Map<number, number>();
  try {
    const rows = await db
      .select({ reactionId: votes.reactionId, n: count() })
      .from(votes)
      .where(eq(votes.articleId, articleId))
      .groupBy(votes.reactionId);
    for (const r of rows) {
      const key = r.reactionId ?? fallbackId;
      if (key === null) continue;
      out.set(key, (out.get(key) ?? 0) + Number(r.n));
    }
  } catch {
    // vazio
  }
  return out;
}

/** Nomes dos membros que reagiram (mais recentes primeiro), para o resumo
 * "Fulano, Sicrano e mais N". */
export async function getRecentReactors(articleId: number, limit = 3): Promise<{ names: string[]; total: number }> {
  try {
    const { users } = await import("@/db/schema");
    const { desc } = await import("drizzle-orm");
    const rows = await db
      .select({ name: users.displayName })
      .from(votes)
      .innerJoin(users, eq(users.id, votes.userId))
      .where(eq(votes.articleId, articleId))
      .orderBy(desc(votes.id))
      .limit(limit);
    const [c] = await db.select({ n: count() }).from(votes).where(eq(votes.articleId, articleId));
    return { names: rows.map((r) => r.name), total: Number(c?.n ?? 0) };
  } catch {
    return { names: [], total: 0 };
  }
}

export async function getUserReaction(userId: number, articleId: number, fallbackId: number | null): Promise<number | null> {
  try {
    const [row] = await db
      .select({ reactionId: votes.reactionId })
      .from(votes)
      .where(and(eq(votes.userId, userId), eq(votes.articleId, articleId)))
      .limit(1);
    if (!row) return null;
    return row.reactionId ?? fallbackId;
  } catch {
    return null;
  }
}

// ── CRUD admin ────────────────────────────────────────────────────────────

export type ReactionInput = { name: string; emoji: string; weight: number; enabled: boolean };

export async function createReaction(input: ReactionInput): Promise<number | null> {
  try {
    await ensureReactions();
    const all = await db.select({ s: reactions.sortOrder }).from(reactions);
    const sortOrder = Math.max(0, ...all.map((r) => r.s)) + 1;
    const [res] = await db.insert(reactions).values({ ...input, sortOrder });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function updateReaction(id: number, input: ReactionInput): Promise<boolean> {
  try {
    await db.update(reactions).set(input).where(eq(reactions.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function setReactionEnabled(id: number, enabled: boolean): Promise<boolean> {
  try {
    await db.update(reactions).set({ enabled }).where(eq(reactions.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deleteReaction(id: number): Promise<boolean> {
  try {
    // Mantém os votos, mas desvincula (viram legado da reação padrão).
    await db.update(votes).set({ reactionId: null }).where(eq(votes.reactionId, id));
    await db.delete(reactions).where(eq(reactions.id, id));
    return true;
  } catch {
    return false;
  }
}

/** Mapa id→reação para um conjunto (para exibir nomes/emojis). */
export async function reactionsByIds(ids: number[]): Promise<Map<number, Reaction>> {
  const out = new Map<number, Reaction>();
  if (ids.length === 0) return out;
  try {
    const rows = await db.select().from(reactions).where(inArray(reactions.id, ids));
    for (const r of rows) out.set(r.id, r);
  } catch {
    // vazio
  }
  return out;
}
