"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser, getCurrentUser, can } from "@/lib/auth-helpers";
import { setSetting, sanitizeWarningSettings, getWarningSettings } from "@/lib/settings";
import { createReason, updateReason, deleteReason, createAction, deleteAction, issueWarning, getReason, acknowledgeAllWarnings } from "@/lib/warnings";
import { logModAction } from "@/lib/panel";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

/** Membro confirma (acknowledge) as próprias advertências. */
export async function acknowledgeWarningsAction(): Promise<Result> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }
  await acknowledgeAllWarnings(Number(user.id));
  revalidatePath("/conta");
  return { ok: true };
}

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

export async function saveWarningSettingsAction(body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    await setSetting("warnings", sanitizeWarningSettings(JSON.parse(body)));
    revalidatePath("/admin/avisos");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}

// ── Motivos ────────────────────────────────────────────────────────────────

function parseReason(body: string) {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const name = String(p.name ?? "").trim();
    if (name.length < 1 || name.length > 120) return null;
    const points = Math.max(0, Math.min(1000, Math.floor(Number(p.points) || 0)));
    const removeRaw = Math.floor(Number(p.removeAfterHours) || 0);
    return {
      name,
      points,
      removeAfterHours: removeRaw > 0 ? removeRaw : null,
      deductReputation: Math.max(0, Math.floor(Number(p.deductReputation) || 0)),
      defaultNote: String(p.defaultNote ?? "").slice(0, 500),
    };
  } catch {
    return null;
  }
}

export async function createReasonAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseReason(body);
  if (!input) return { ok: false, error: "Dados inválidos." };
  const id = await createReason(input);
  if (!id) return { ok: false, error: "Falha ao criar." };
  revalidatePath("/admin/avisos");
  return { ok: true, data: { id } };
}

export async function updateReasonAction(id: number, body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseReason(body);
  if (!input) return { ok: false, error: "Dados inválidos." };
  if (!(await updateReason(id, input))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/avisos");
  return { ok: true };
}

export async function deleteReasonAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteReason(id))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/avisos");
  return { ok: true };
}

// ── Ações ────────────────────────────────────────────────────────────────

function parseAction(body: string) {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const points = Math.floor(Number(p.points) || 0);
    if (points <= 0) return null;
    const hrs = (v: unknown) => {
      const n = Math.floor(Number(v) || 0);
      return n < 0 ? -1 : Math.max(0, Math.min(100000, n));
    };
    return { points, restrictHours: hrs(p.restrictHours), banHours: hrs(p.banHours), moderateHours: hrs(p.moderateHours) };
  } catch {
    return null;
  }
}

export async function createActionAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseAction(body);
  if (!input) return { ok: false, error: "Informe os pontos (> 0)." };
  const id = await createAction(input);
  if (id === null) return { ok: false, error: "Falha ao criar." };
  revalidatePath("/admin/avisos");
  return { ok: true, data: { id } };
}

export async function deleteActionAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteAction(id))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/avisos");
  return { ok: true };
}

// ── Avisar membro (moderador) ──────────────────────────────────────────────

export async function warnMemberAction(userId: number, reasonId: number, points: number, note: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!can.moderate(user)) return { ok: false, error: "Acesso restrito." };

  const settings = await getWarningSettings();
  if (!settings.enabled) return { ok: false, error: "Sistema de advertências desativado." };

  // Não avisar membros de grupos protegidos.
  const { db: database } = await import("@/db");
  const { users } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const [target] = await database.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return { ok: false, error: "Membro não encontrado." };
  if (settings.cannotWarnRoles.includes(target.role)) return { ok: false, error: "Este grupo não pode ser advertido." };

  const reason = await getReason(reasonId);
  if (!reason) return { ok: false, error: "Motivo inválido." };
  const pts = Math.max(0, Math.floor(Number(points) || reason.points));

  const res = await issueWarning(userId, reasonId, pts, String(note ?? ""), Number(user!.id));
  if (res.ok) {
    await logModAction(Number(user!.id), "warn_member", `user:${userId}`, { reason: reason.name, points: pts });
    revalidatePath(`/admin/membros/${userId}`);
  }
  return res;
}
