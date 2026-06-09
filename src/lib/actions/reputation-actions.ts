"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { setSetting, sanitizeReputationSettings } from "@/lib/settings";
import { createReaction, updateReaction, deleteReaction, setReactionEnabled } from "@/lib/reactions";
import { createLevel, updateLevel, deleteLevel } from "@/lib/reputation-levels";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

// ── Configurações ──────────────────────────────────────────────────────────

export async function saveReputationSettingsAction(body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    const settings = sanitizeReputationSettings(JSON.parse(body));
    await setSetting("reputation", settings);
    revalidatePath("/admin/reputacao");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}

// ── Reações ────────────────────────────────────────────────────────────────

function parseReaction(body: string): { name: string; emoji: string; weight: number; enabled: boolean } | null {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const name = String(p.name ?? "").trim();
    if (name.length < 1 || name.length > 60) return null;
    const emoji = String(p.emoji ?? "").trim().slice(0, 16) || "👍";
    const w = Math.floor(Number(p.weight));
    const weight = w === 1 || w === 0 || w === -1 ? w : 1;
    return { name, emoji, weight, enabled: p.enabled === undefined ? true : Boolean(p.enabled) };
  } catch {
    return null;
  }
}

export async function createReactionAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseReaction(body);
  if (!input) return { ok: false, error: "Dados inválidos." };
  const id = await createReaction(input);
  if (!id) return { ok: false, error: "Falha ao criar." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "reaction_create", target: `reaction:${id}` });
  revalidatePath("/admin/reputacao");
  return { ok: true, data: { id } };
}

export async function updateReactionAction(id: number, body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseReaction(body);
  if (!input) return { ok: false, error: "Dados inválidos." };
  if (!(await updateReaction(id, input))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/reputacao");
  return { ok: true };
}

export async function setReactionEnabledAction(id: number, enabled: boolean): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await setReactionEnabled(id, enabled))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/reputacao");
  return { ok: true };
}

export async function deleteReactionAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteReaction(id))) return { ok: false, error: "Falha ao excluir." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "reaction_delete", target: `reaction:${id}` });
  revalidatePath("/admin/reputacao");
  return { ok: true };
}

// ── Níveis de reputação ────────────────────────────────────────────────────

function parseLevel(body: string): { title: string; points: number; badge: string | null } | null {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const title = String(p.title ?? "").trim();
    if (title.length < 1 || title.length > 80) return null;
    const points = Math.max(-1000000, Math.min(1000000, Math.floor(Number(p.points) || 0)));
    const badge = String(p.badge ?? "").trim().slice(0, 80) || null;
    return { title, points, badge };
  } catch {
    return null;
  }
}

export async function createLevelAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseLevel(body);
  if (!input) return { ok: false, error: "Dados inválidos." };
  const id = await createLevel(input);
  if (!id) return { ok: false, error: "Falha ao criar." };
  revalidatePath("/admin/reputacao");
  return { ok: true, data: { id } };
}

export async function updateLevelAction(id: number, body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseLevel(body);
  if (!input) return { ok: false, error: "Dados inválidos." };
  if (!(await updateLevel(id, input))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/reputacao");
  return { ok: true };
}

export async function deleteLevelAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteLevel(id))) return { ok: false, error: "Falha ao excluir." };
  revalidatePath("/admin/reputacao");
  return { ok: true };
}
