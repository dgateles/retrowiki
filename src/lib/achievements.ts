import "server-only";
import { and, asc, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { achievementRules, users, comments, articles, votes } from "@/db/schema";
import { awardBadgeBySlug, evaluateBadges } from "@/lib/badges";

export type Recipient = { key: "actor" | "target"; label: string };
export type TriggerDef = { label: string; recipients: Recipient[] };

// Gatilhos suportados (fase 1: eventos que já disparamos hoje).
export const TRIGGERS: Record<string, TriggerDef> = {
  "comment.posted": {
    label: "Comentário publicado",
    recipients: [
      { key: "actor", label: "Quem comentou" },
      { key: "target", label: "Autor do guia comentado" },
    ],
  },
  "guide.published": {
    label: "Guia publicado",
    recipients: [{ key: "actor", label: "Autor do guia" }],
  },
  "reaction.given": {
    label: "Reação (voto) dada",
    recipients: [
      { key: "actor", label: "Quem reagiu" },
      { key: "target", label: "Autor do conteúdo" },
    ],
  },
};

export type Reward = { points: number; badge: string };
export type Rewards = { actor?: Reward; target?: Reward };

export type AchievementRule = {
  id: number;
  name: string;
  trigger: string;
  milestone: number;
  enabled: boolean;
  sortOrder: number;
  rewards: Rewards;
};

export function isTrigger(t: string): boolean {
  return Object.prototype.hasOwnProperty.call(TRIGGERS, t);
}

function sanitizeReward(raw: unknown): Reward {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    points: Math.max(0, Math.min(100000, Math.floor(Number(r.points) || 0))),
    badge: typeof r.badge === "string" ? r.badge : "",
  };
}

export function sanitizeRewards(trigger: string, raw: unknown): Rewards {
  const def = TRIGGERS[trigger];
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Rewards = {};
  for (const rec of def?.recipients ?? []) {
    out[rec.key] = sanitizeReward(input[rec.key]);
  }
  return out;
}

export async function listRules(): Promise<AchievementRule[]> {
  try {
    const rows = await db.select().from(achievementRules).orderBy(asc(achievementRules.sortOrder), asc(achievementRules.id));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      trigger: r.trigger,
      milestone: r.milestone,
      enabled: r.enabled,
      sortOrder: r.sortOrder,
      rewards: sanitizeRewards(r.trigger, r.rewards),
    }));
  } catch {
    return [];
  }
}

export async function getRule(id: number): Promise<AchievementRule | null> {
  try {
    const [r] = await db.select().from(achievementRules).where(eq(achievementRules.id, id)).limit(1);
    if (!r) return null;
    return { id: r.id, name: r.name, trigger: r.trigger, milestone: r.milestone, enabled: r.enabled, sortOrder: r.sortOrder, rewards: sanitizeRewards(r.trigger, r.rewards) };
  } catch {
    return null;
  }
}

const DEFAULTS: { name: string; trigger: string; milestone: number; rewards: Rewards }[] = [
  { name: "Comentário publicado", trigger: "comment.posted", milestone: 0, rewards: { actor: { points: 5, badge: "" } } },
  { name: "Guia publicado", trigger: "guide.published", milestone: 0, rewards: { actor: { points: 10, badge: "" } } },
  { name: "Reação recebida", trigger: "reaction.given", milestone: 0, rewards: { actor: { points: 1, badge: "" }, target: { points: 1, badge: "" } } },
];

/** Semeia um conjunto inicial de regras se a tabela estiver vazia. */
export async function ensureDefaultRules(): Promise<void> {
  try {
    const [row] = await db.select({ n: count() }).from(achievementRules);
    if ((row?.n ?? 0) > 0) return;
    await db.insert(achievementRules).values(
      DEFAULTS.map((d, i) => ({ name: d.name, trigger: d.trigger, milestone: d.milestone, sortOrder: i, rewards: d.rewards, enabled: true })),
    );
  } catch {
    // ignora
  }
}

async function addPoints(userId: number, n: number): Promise<void> {
  if (n <= 0) return;
  await db.update(users).set({ reputation: sql`${users.reputation} + ${n}` }).where(eq(users.id, userId));
}

async function applyReward(userId: number, reward: Reward | undefined): Promise<void> {
  if (!reward) return;
  if (reward.points > 0) await addPoints(userId, reward.points);
  if (reward.badge) await awardBadgeBySlug(userId, reward.badge);
}

/** Conta de quantas ações daquele gatilho o usuário já fez (para os marcos). */
async function actionCount(trigger: string, userId: number): Promise<number> {
  try {
    if (trigger === "comment.posted") {
      const [r] = await db.select({ n: count() }).from(comments).where(and(eq(comments.authorId, userId), eq(comments.status, "visible")));
      return r?.n ?? 0;
    }
    if (trigger === "guide.published") {
      const [r] = await db.select({ n: count() }).from(articles).where(and(eq(articles.authorId, userId), eq(articles.status, "published")));
      return r?.n ?? 0;
    }
    if (trigger === "reaction.given") {
      const [r] = await db.select({ n: count() }).from(votes).where(eq(votes.userId, userId));
      return r?.n ?? 0;
    }
  } catch {
    // ignora
  }
  return 0;
}

/**
 * Executa as regras de um gatilho. ctx.actorId é quem fez a ação; ctx.targetId
 * é o dono do conteúdo afetado (opcional). Concede pontos/badges conforme as
 * regras ativas, respeitando o marco (a N-ésima ação do ator).
 */
export async function runTrigger(
  trigger: string,
  ctx: { actorId: number; targetId?: number | null },
): Promise<void> {
  try {
    if (!isTrigger(trigger)) return;
    const rules = (await listRules()).filter((r) => r.enabled && r.trigger === trigger);
    if (rules.length === 0) return;

    const needsCount = rules.some((r) => r.milestone > 0);
    const cnt = needsCount ? await actionCount(trigger, ctx.actorId) : 0;
    const target = ctx.targetId && ctx.targetId !== ctx.actorId ? ctx.targetId : null;

    const affected = new Set<number>();
    for (const rule of rules) {
      if (rule.milestone > 0 && cnt !== rule.milestone) continue;
      await applyReward(ctx.actorId, rule.rewards.actor);
      affected.add(ctx.actorId);
      if (target && rule.rewards.target) {
        await applyReward(target, rule.rewards.target);
        affected.add(target);
      }
    }
    // Reavalia as badges de catálogo (limiares de reputação) dos afetados.
    for (const id of affected) await evaluateBadges(id);
  } catch {
    // nunca bloquear o fluxo principal
  }
}
