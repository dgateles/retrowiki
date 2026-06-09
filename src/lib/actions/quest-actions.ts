"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { createQuest, updateQuest, deleteQuest, setQuestEnabled, createTask, updateTask, deleteTask } from "@/lib/admin/quests";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

function parseQuest(body: string): { title: string; description: string; rewardBadge: string | null } | null {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const title = String(p.title ?? "").trim();
    if (title.length < 2 || title.length > 160) return null;
    const description = String(p.description ?? "").trim().slice(0, 2000);
    const rb = String(p.rewardBadge ?? "").trim();
    return { title, description, rewardBadge: rb || null };
  } catch {
    return null;
  }
}

function parseTask(body: string): { title: string; description: string; link: string | null; ruleId: number } | null {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const title = String(p.title ?? "").trim();
    if (title.length < 2 || title.length > 160) return null;
    const ruleId = Math.floor(Number(p.ruleId) || 0);
    if (ruleId <= 0) return null;
    const description = String(p.description ?? "").trim().slice(0, 1000);
    const rawLink = String(p.link ?? "").trim();
    const link = /^\/[\w\-/]*$/.test(rawLink) || /^https?:\/\//.test(rawLink) ? rawLink.slice(0, 400) : null;
    return { title, description, link, ruleId };
  } catch {
    return null;
  }
}

export async function createQuestAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const p = parseQuest(body);
  if (!p) return { ok: false, error: "Dados inválidos." };
  const id = await createQuest(p);
  if (!id) return { ok: false, error: "Falha ao criar." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "quest_create", target: `quest:${id}` });
  revalidatePath("/admin/quests");
  return { ok: true, data: { id } };
}

export async function updateQuestAction(id: number, body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const p = parseQuest(body);
  if (!p) return { ok: false, error: "Dados inválidos." };
  if (!(await updateQuest(id, p))) return { ok: false, error: "Falha ao salvar." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "quest_update", target: `quest:${id}` });
  revalidatePath("/admin/quests");
  revalidatePath(`/admin/quests/${id}`);
  return { ok: true };
}

export async function toggleQuestAction(id: number, enabled: boolean): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await setQuestEnabled(id, enabled))) return { ok: false, error: "Falha." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: enabled ? "quest_enable" : "quest_disable", target: `quest:${id}` });
  revalidatePath("/admin/quests");
  revalidatePath("/missoes");
  return { ok: true };
}

export async function deleteQuestAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteQuest(id))) return { ok: false, error: "Falha ao excluir." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "quest_delete", target: `quest:${id}` });
  revalidatePath("/admin/quests");
  return { ok: true };
}

export async function createTaskAction(questId: number, body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const p = parseTask(body);
  if (!p) return { ok: false, error: "Dados inválidos." };
  const id = await createTask(questId, p);
  if (!id) return { ok: false, error: "Falha ao criar." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "quest_task_create", target: `quest:${questId}` });
  revalidatePath(`/admin/quests/${questId}`);
  return { ok: true };
}

export async function updateTaskAction(taskId: number, questId: number, body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const p = parseTask(body);
  if (!p) return { ok: false, error: "Dados inválidos." };
  if (!(await updateTask(taskId, p))) return { ok: false, error: "Falha ao salvar." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "quest_task_update", target: `task:${taskId}` });
  revalidatePath(`/admin/quests/${questId}`);
  return { ok: true };
}

export async function deleteTaskAction(taskId: number, questId: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteTask(taskId))) return { ok: false, error: "Falha ao excluir." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "quest_task_delete", target: `task:${taskId}` });
  revalidatePath(`/admin/quests/${questId}`);
  return { ok: true };
}
