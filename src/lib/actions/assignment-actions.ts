"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { requireRole, getCurrentUser, can } from "@/lib/auth-helpers";
import { setSetting, sanitizeAssignmentSettings } from "@/lib/settings";
import { createTeam, updateTeam, deleteTeam, createAssignment, closeAssignment } from "@/lib/assignments";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

export async function saveAssignmentSettingsAction(body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    await setSetting("assignments", sanitizeAssignmentSettings(JSON.parse(body)));
    revalidatePath("/admin/atribuicoes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}

// ── Equipes ────────────────────────────────────────────────────────────────

function parseTeam(body: string): { name: string; memberIds: number[] } | null {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const name = String(p.name ?? "").trim();
    if (name.length < 1 || name.length > 120) return null;
    const memberIds = Array.isArray(p.memberIds) ? p.memberIds.map((x) => Math.floor(Number(x) || 0)).filter((n) => n > 0) : [];
    return { name, memberIds };
  } catch {
    return null;
  }
}

export async function createTeamAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseTeam(body);
  if (!input) return { ok: false, error: "Informe o nome." };
  const id = await createTeam(input.name, input.memberIds);
  if (!id) return { ok: false, error: "Falha ao criar." };
  revalidatePath("/admin/atribuicoes");
  return { ok: true, data: { id } };
}

export async function updateTeamAction(id: number, body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseTeam(body);
  if (!input) return { ok: false, error: "Dados inválidos." };
  if (!(await updateTeam(id, input.name, input.memberIds))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/atribuicoes");
  return { ok: true };
}

export async function deleteTeamAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteTeam(id))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/atribuicoes");
  return { ok: true };
}

// ── Atribuir / fechar (moderador) ──────────────────────────────────────────

export async function assignContentAction(targetId: number, assigneeType: "user" | "team", assigneeId: number, note: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!can.moderate(user)) return { ok: false, error: "Acesso restrito." };
  if (assigneeType !== "user" && assigneeType !== "team") return { ok: false, error: "Destino inválido." };
  const res = await createAssignment(Math.floor(Number(targetId) || 0), assigneeType, Math.floor(Number(assigneeId) || 0), String(note ?? ""), Number(user!.id));
  if (res.ok) {
    await db.insert(auditLog).values({ actorId: Number(user!.id), action: "assign_content", target: `article:${targetId}` });
    revalidatePath("/admin/atribuicoes");
  }
  return res;
}

export async function closeAssignmentAction(id: number): Promise<Result> {
  const user = await getCurrentUser();
  if (!can.moderate(user)) return { ok: false, error: "Acesso restrito." };
  if (!(await closeAssignment(id))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/atribuicoes");
  return { ok: true };
}
