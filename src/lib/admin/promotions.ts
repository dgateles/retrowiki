import "server-only";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { promotionRules, users, articles, comments, userBadges, badges, auditLog } from "@/db/schema";
import { rankForReputation } from "@/lib/ranks";
import { ROLES, type Role } from "@/lib/admin/role-permissions";

export type Criteria = {
  minReputation: number;
  minContent: number;
  minRank: number; // índice do rank (0 = qualquer)
  badge: string; // slug exigida ("" = nenhuma)
  suspended: "any" | "yes" | "no";
  fromRoles: string[]; // papéis atuais aos quais a regra se aplica
};

export type PromotionRule = {
  id: number;
  name: string;
  enabled: boolean;
  sortOrder: number;
  criteria: Criteria;
  targetRole: Role;
};

export const DEFAULT_CRITERIA: Criteria = {
  minReputation: 0,
  minContent: 0,
  minRank: 0,
  badge: "",
  suspended: "any",
  fromRoles: ["member"],
};

export function sanitizeCriteria(raw: unknown): Criteria {
  const c = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const num = (v: unknown) => Math.max(0, Math.min(1_000_000, Math.floor(Number(v) || 0)));
  const susp = c.suspended === "yes" || c.suspended === "no" ? (c.suspended as "yes" | "no") : "any";
  const fromRoles = Array.isArray(c.fromRoles) ? c.fromRoles.filter((r): r is string => ROLES.includes(r as Role)) : [];
  return {
    minReputation: num(c.minReputation),
    minContent: num(c.minContent),
    minRank: num(c.minRank),
    badge: typeof c.badge === "string" ? c.badge : "",
    suspended: susp,
    fromRoles,
  };
}

export async function listRules(): Promise<PromotionRule[]> {
  try {
    const rows = await db.select().from(promotionRules).orderBy(asc(promotionRules.sortOrder), asc(promotionRules.id));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      enabled: r.enabled,
      sortOrder: r.sortOrder,
      criteria: sanitizeCriteria(r.criteria),
      targetRole: r.targetRole as Role,
    }));
  } catch {
    return [];
  }
}

export async function getRule(id: number): Promise<PromotionRule | null> {
  try {
    const [r] = await db.select().from(promotionRules).where(eq(promotionRules.id, id)).limit(1);
    if (!r) return null;
    return { id: r.id, name: r.name, enabled: r.enabled, sortOrder: r.sortOrder, criteria: sanitizeCriteria(r.criteria), targetRole: r.targetRole as Role };
  } catch {
    return null;
  }
}

type MemberStats = { role: string; reputation: number; suspended: boolean; content: number; rankIndex: number; badges: Set<string> };

function matches(stats: MemberStats, c: Criteria): boolean {
  if (c.fromRoles.length > 0 && !c.fromRoles.includes(stats.role)) return false;
  if (stats.reputation < c.minReputation) return false;
  if (stats.content < c.minContent) return false;
  if (c.minRank > 0 && stats.rankIndex < c.minRank) return false;
  if (c.badge && !stats.badges.has(c.badge)) return false;
  if (c.suspended === "yes" && !stats.suspended) return false;
  if (c.suspended === "no" && stats.suspended) return false;
  return true;
}

async function statsFor(userId: number): Promise<MemberStats | null> {
  const [u] = await db
    .select({ role: users.role, reputation: users.reputation, suspended: users.isSuspended })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;
  const [g] = await db.select({ n: count() }).from(articles).where(and(eq(articles.authorId, userId), eq(articles.status, "published")));
  const [c] = await db.select({ n: count() }).from(comments).where(and(eq(comments.authorId, userId), eq(comments.status, "visible")));
  const bs = await db.select({ slug: badges.slug }).from(userBadges).innerJoin(badges, eq(badges.id, userBadges.badgeId)).where(eq(userBadges.userId, userId));
  return {
    role: u.role,
    reputation: u.reputation,
    suspended: u.suspended,
    content: (g?.n ?? 0) + (c?.n ?? 0),
    rankIndex: rankForReputation(u.reputation).index,
    badges: new Set(bs.map((b) => b.slug)),
  };
}

/** Aplica a auto-promoção a um usuário. Vale a última regra ativa cujo critério
 * bate. Retorna o novo papel se mudou, ou null. */
export async function runPromotionsForUser(userId: number, actorId?: number): Promise<Role | null> {
  try {
    const stats = await statsFor(userId);
    if (!stats) return null;
    const rules = (await listRules()).filter((r) => r.enabled);
    let target: Role | null = null;
    for (const rule of rules) {
      if (matches(stats, rule.criteria)) target = rule.targetRole;
    }
    if (!target || target === stats.role) return null;
    await db.update(users).set({ role: target }).where(eq(users.id, userId));
    await db.insert(auditLog).values({ actorId: actorId ?? null, action: "auto_promotion", target: `user:${userId}`, meta: { from: stats.role, to: target } });
    return target;
  } catch {
    return null;
  }
}

/** Roda a auto-promoção para todos os usuários. Retorna quantos mudaram. */
export async function runAllPromotions(actorId?: number): Promise<number> {
  let changed = 0;
  try {
    const all = await db.select({ id: users.id }).from(users);
    for (const u of all) {
      const r = await runPromotionsForUser(u.id, actorId);
      if (r) changed += 1;
    }
  } catch {
    // ignora
  }
  return changed;
}
