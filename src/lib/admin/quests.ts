import "server-only";
import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { quests, questTasks, questTaskCompletions, questCompletions, questOptOuts, comments, articles, votes, users, achievementRules } from "@/db/schema";
import { awardBadgeBySlug } from "@/lib/badges";

export type QuestSettings = {
  rewardBadge: string | null;
  coverImage: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  audienceRoles: string[];
  allowOptOut: boolean;
  retroactive: boolean;
};
export type QuestInput = { title: string; description: string } & QuestSettings;

export type QuestRow = { id: number; title: string; description: string; enabled: boolean; sortOrder: number; rewardBadge: string | null; taskCount: number };
export type QuestTask = { id: number; questId: number; title: string; description: string; link: string | null; ruleId: number; sortOrder: number };
export type QuestDetail = QuestSettings & { id: number; title: string; description: string; enabled: boolean; sortOrder: number; tasks: QuestTask[] };

function asRoles(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export async function listQuests(): Promise<QuestRow[]> {
  try {
    const rows = await db
      .select({
        id: quests.id, title: quests.title, description: quests.description, enabled: quests.enabled,
        sortOrder: quests.sortOrder, rewardBadge: quests.rewardBadge,
        taskCount: sql<number>`(select count(*) from ${questTasks} where ${questTasks.questId} = ${quests.id})`,
      })
      .from(quests)
      .orderBy(asc(quests.sortOrder), asc(quests.id));
    return rows.map((r) => ({ ...r, taskCount: Number(r.taskCount) }));
  } catch {
    return [];
  }
}

export async function getQuest(id: number): Promise<QuestDetail | null> {
  try {
    const [q] = await db.select().from(quests).where(eq(quests.id, id)).limit(1);
    if (!q) return null;
    const tasks = await db.select().from(questTasks).where(eq(questTasks.questId, id)).orderBy(asc(questTasks.sortOrder), asc(questTasks.id));
    return {
      id: q.id, title: q.title, description: q.description, enabled: q.enabled, sortOrder: q.sortOrder,
      rewardBadge: q.rewardBadge, coverImage: q.coverImage, startsAt: q.startsAt, endsAt: q.endsAt,
      audienceRoles: asRoles(q.audienceRoles), allowOptOut: q.allowOptOut, retroactive: q.retroactive, tasks,
    };
  } catch {
    return null;
  }
}

export async function createQuest(input: QuestInput): Promise<number | null> {
  try {
    const [maxRow] = await db.select({ m: sql<number>`COALESCE(MAX(${quests.sortOrder}), 0)` }).from(quests);
    const [res] = await db.insert(quests).values({
      title: input.title, description: input.description, rewardBadge: input.rewardBadge, coverImage: input.coverImage,
      startsAt: input.startsAt, endsAt: input.endsAt, audienceRoles: input.audienceRoles, allowOptOut: input.allowOptOut,
      retroactive: input.retroactive, sortOrder: Number(maxRow?.m ?? 0) + 1, enabled: false,
    });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function updateQuest(id: number, input: QuestInput): Promise<boolean> {
  try {
    await db.update(quests).set({
      title: input.title, description: input.description, rewardBadge: input.rewardBadge, coverImage: input.coverImage,
      startsAt: input.startsAt, endsAt: input.endsAt, audienceRoles: input.audienceRoles, allowOptOut: input.allowOptOut,
      retroactive: input.retroactive,
    }).where(eq(quests.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function setQuestEnabled(id: number, enabled: boolean): Promise<boolean> {
  try {
    await db.update(quests).set({ enabled }).where(eq(quests.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deleteQuest(id: number): Promise<boolean> {
  try {
    const taskIds = (await db.select({ id: questTasks.id }).from(questTasks).where(eq(questTasks.questId, id))).map((t) => t.id);
    if (taskIds.length) await db.delete(questTaskCompletions).where(inArray(questTaskCompletions.taskId, taskIds));
    await db.delete(questTasks).where(eq(questTasks.questId, id));
    await db.delete(questCompletions).where(eq(questCompletions.questId, id));
    await db.delete(quests).where(eq(quests.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function getTask(id: number): Promise<QuestTask | null> {
  try {
    const [t] = await db.select().from(questTasks).where(eq(questTasks.id, id)).limit(1);
    return t ?? null;
  } catch {
    return null;
  }
}

export async function createTask(questId: number, input: { title: string; description: string; link: string | null; ruleId: number }): Promise<number | null> {
  try {
    const [maxRow] = await db.select({ m: sql<number>`COALESCE(MAX(${questTasks.sortOrder}), 0)` }).from(questTasks).where(eq(questTasks.questId, questId));
    const [res] = await db.insert(questTasks).values({ questId, title: input.title, description: input.description, link: input.link, ruleId: input.ruleId, sortOrder: Number(maxRow?.m ?? 0) + 1 });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function updateTask(id: number, input: { title: string; description: string; link: string | null; ruleId: number }): Promise<boolean> {
  try {
    await db.update(questTasks).set({ title: input.title, description: input.description, link: input.link, ruleId: input.ruleId }).where(eq(questTasks.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deleteTask(id: number): Promise<boolean> {
  try {
    await db.delete(questTaskCompletions).where(eq(questTaskCompletions.taskId, id));
    await db.delete(questTasks).where(eq(questTasks.id, id));
    return true;
  } catch {
    return false;
  }
}

// ── Elegibilidade / opt-out / retroativo ─────────────────────────────────

type EligFields = { startsAt: Date | null; endsAt: Date | null; audienceRoles: unknown };

function eligible(q: EligFields, role: string | null, now: number): boolean {
  if (q.startsAt && now < new Date(q.startsAt).getTime()) return false;
  if (q.endsAt && now > new Date(q.endsAt).getTime()) return false;
  const roles = asRoles(q.audienceRoles);
  if (roles.length > 0 && (!role || !roles.includes(role))) return false;
  return true;
}

async function roleOf(userId: number): Promise<string | null> {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  return u?.role ?? null;
}

async function optedOutSet(userId: number): Promise<Set<number>> {
  const rows = await db.select({ questId: questOptOuts.questId }).from(questOptOuts).where(eq(questOptOuts.userId, userId));
  return new Set(rows.map((r) => r.questId));
}

export async function setQuestOptOut(userId: number, questId: number, out: boolean): Promise<void> {
  if (out) {
    await db.insert(questOptOuts).values({ questId, userId }).onDuplicateKeyUpdate({ set: { questId: sql`quest_id` } });
  } else {
    await db.delete(questOptOuts).where(and(eq(questOptOuts.questId, questId), eq(questOptOuts.userId, userId)));
  }
}

/** Quantas vezes o usuário já realizou a ação de um gatilho (para retroativo). */
async function triggerCount(trigger: string, userId: number): Promise<number> {
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
  return 0;
}

/** Marca como concluídas as tarefas que o usuário já satisfez (regras retroativas). */
async function applyRetroactive(userId: number, questId: number): Promise<void> {
  const tasks = await db.select({ id: questTasks.id, ruleId: questTasks.ruleId }).from(questTasks).where(eq(questTasks.questId, questId));
  if (tasks.length === 0) return;
  const ruleIds = [...new Set(tasks.map((t) => t.ruleId))];
  const rules = await db.select({ id: achievementRules.id, trigger: achievementRules.trigger, milestone: achievementRules.milestone }).from(achievementRules).where(inArray(achievementRules.id, ruleIds));
  const byId = new Map(rules.map((r) => [r.id, r]));
  for (const t of tasks) {
    const rule = byId.get(t.ruleId);
    if (!rule) continue;
    const need = rule.milestone > 0 ? rule.milestone : 1;
    const have = await triggerCount(rule.trigger, userId);
    if (have >= need) {
      await db.insert(questTaskCompletions).values({ taskId: t.id, userId }).onDuplicateKeyUpdate({ set: { taskId: sql`task_id` } });
    }
  }
  await maybeCompleteQuest(questId, userId);
}

// ── Motor de conclusão ───────────────────────────────────────────────────

async function maybeCompleteQuest(questId: number, userId: number): Promise<void> {
  const allTasks = await db.select({ id: questTasks.id }).from(questTasks).where(eq(questTasks.questId, questId));
  if (allTasks.length === 0) return;
  const ids = allTasks.map((t) => t.id);
  const [doneRow] = await db.select({ n: count() }).from(questTaskCompletions).where(and(inArray(questTaskCompletions.taskId, ids), eq(questTaskCompletions.userId, userId)));
  if ((doneRow?.n ?? 0) < allTasks.length) return;
  // Todas concluídas: registra (uma vez) e concede a recompensa.
  try {
    await db.insert(questCompletions).values({ questId, userId });
  } catch {
    return; // já estava completa
  }
  const [q] = await db.select({ rewardBadge: quests.rewardBadge }).from(quests).where(eq(quests.id, questId)).limit(1);
  if (q?.rewardBadge) await awardBadgeBySlug(userId, q.rewardBadge);
}

/** Marca as tarefas ligadas a uma regra como concluídas para o usuário e
 * completa as missões cujas tarefas estejam todas feitas. */
export async function progressQuestsForRule(userId: number, ruleId: number): Promise<void> {
  try {
    const rows = await db
      .select({ taskId: questTasks.id, questId: quests.id, startsAt: quests.startsAt, endsAt: quests.endsAt, audienceRoles: quests.audienceRoles })
      .from(questTasks)
      .innerJoin(quests, eq(quests.id, questTasks.questId))
      .where(and(eq(questTasks.ruleId, ruleId), eq(quests.enabled, true)));
    if (rows.length === 0) return;
    const role = await roleOf(userId);
    const optedOut = await optedOutSet(userId);
    const now = Date.now();
    const affected = new Set<number>();
    for (const r of rows) {
      if (optedOut.has(r.questId)) continue;
      if (!eligible(r, role, now)) continue;
      await db.insert(questTaskCompletions).values({ taskId: r.taskId, userId }).onDuplicateKeyUpdate({ set: { taskId: sql`task_id` } });
      affected.add(r.questId);
    }
    for (const qid of affected) await maybeCompleteQuest(qid, userId);
  } catch {
    // nunca bloquear o fluxo
  }
}

// ── Leitura pública ──────────────────────────────────────────────────────

export type PublicTask = { id: number; title: string; description: string; link: string | null; done: boolean };
export type PublicQuest = { id: number; title: string; description: string; coverImage: string | null; rewardBadge: string | null; completed: boolean; allowOptOut: boolean; optedOut: boolean; tasks: PublicTask[] };

export async function getQuestsForUser(userId: number | null): Promise<PublicQuest[]> {
  try {
    const now = Date.now();
    const role = userId ? await roleOf(userId) : null;
    const all = await db.select().from(quests).where(eq(quests.enabled, true)).orderBy(asc(quests.sortOrder), asc(quests.id));
    const qs = all.filter((q) => eligible(q, role, now));
    if (qs.length === 0) return [];

    const optedOut = userId ? await optedOutSet(userId) : new Set<number>();

    // Regras retroativas: marca tarefas já satisfeitas antes de ler o progresso.
    if (userId) {
      for (const q of qs) {
        if (q.retroactive && !optedOut.has(q.id)) await applyRetroactive(userId, q.id);
      }
    }

    const allTasks = await db.select().from(questTasks).where(inArray(questTasks.questId, qs.map((q) => q.id))).orderBy(asc(questTasks.sortOrder), asc(questTasks.id));
    const doneTaskIds = new Set<number>();
    const completedQuestIds = new Set<number>();
    if (userId) {
      const dt = await db.select({ taskId: questTaskCompletions.taskId }).from(questTaskCompletions).where(eq(questTaskCompletions.userId, userId));
      dt.forEach((r) => doneTaskIds.add(r.taskId));
      const cq = await db.select({ questId: questCompletions.questId }).from(questCompletions).where(eq(questCompletions.userId, userId));
      cq.forEach((r) => completedQuestIds.add(r.questId));
    }
    return qs.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      coverImage: q.coverImage,
      rewardBadge: q.rewardBadge,
      completed: completedQuestIds.has(q.id),
      allowOptOut: q.allowOptOut,
      optedOut: optedOut.has(q.id),
      tasks: allTasks.filter((t) => t.questId === q.id).map((t) => ({ id: t.id, title: t.title, description: t.description, link: t.link, done: doneTaskIds.has(t.id) })),
    }));
  } catch {
    return [];
  }
}
