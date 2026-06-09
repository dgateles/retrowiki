import "server-only";
import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { quests, questTasks, questTaskCompletions, questCompletions } from "@/db/schema";
import { awardBadgeBySlug } from "@/lib/badges";

export type QuestRow = { id: number; title: string; description: string; enabled: boolean; sortOrder: number; rewardBadge: string | null; taskCount: number };
export type QuestTask = { id: number; questId: number; title: string; description: string; link: string | null; ruleId: number; sortOrder: number };
export type QuestDetail = { id: number; title: string; description: string; enabled: boolean; sortOrder: number; rewardBadge: string | null; tasks: QuestTask[] };

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
    return { id: q.id, title: q.title, description: q.description, enabled: q.enabled, sortOrder: q.sortOrder, rewardBadge: q.rewardBadge, tasks };
  } catch {
    return null;
  }
}

export async function createQuest(input: { title: string; description: string; rewardBadge: string | null }): Promise<number | null> {
  try {
    const [maxRow] = await db.select({ m: sql<number>`COALESCE(MAX(${quests.sortOrder}), 0)` }).from(quests);
    const [res] = await db.insert(quests).values({ title: input.title, description: input.description, rewardBadge: input.rewardBadge, sortOrder: Number(maxRow?.m ?? 0) + 1, enabled: false });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function updateQuest(id: number, input: { title: string; description: string; rewardBadge: string | null }): Promise<boolean> {
  try {
    await db.update(quests).set({ title: input.title, description: input.description, rewardBadge: input.rewardBadge }).where(eq(quests.id, id));
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
    const tasks = await db
      .select({ id: questTasks.id, questId: questTasks.questId })
      .from(questTasks)
      .innerJoin(quests, eq(quests.id, questTasks.questId))
      .where(and(eq(questTasks.ruleId, ruleId), eq(quests.enabled, true)));
    if (tasks.length === 0) return;
    for (const t of tasks) {
      await db.insert(questTaskCompletions).values({ taskId: t.id, userId }).onDuplicateKeyUpdate({ set: { taskId: sql`task_id` } });
    }
    const questIds = [...new Set(tasks.map((t) => t.questId))];
    for (const qid of questIds) await maybeCompleteQuest(qid, userId);
  } catch {
    // nunca bloquear o fluxo
  }
}

// ── Leitura pública ──────────────────────────────────────────────────────

export type PublicTask = { id: number; title: string; description: string; link: string | null; done: boolean };
export type PublicQuest = { id: number; title: string; description: string; rewardBadge: string | null; completed: boolean; tasks: PublicTask[] };

export async function getQuestsForUser(userId: number | null): Promise<PublicQuest[]> {
  try {
    const qs = await db.select().from(quests).where(eq(quests.enabled, true)).orderBy(asc(quests.sortOrder), asc(quests.id));
    if (qs.length === 0) return [];
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
      rewardBadge: q.rewardBadge,
      completed: completedQuestIds.has(q.id),
      tasks: allTasks.filter((t) => t.questId === q.id).map((t) => ({ id: t.id, title: t.title, description: t.description, link: t.link, done: doneTaskIds.has(t.id) })),
    }));
  } catch {
    return [];
  }
}
