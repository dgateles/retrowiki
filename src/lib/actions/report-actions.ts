"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { requireUser, requireRole, getCurrentUser, can } from "@/lib/auth-helpers";
import { setSetting, sanitizeReportingSettings } from "@/lib/settings";
import { createReport, resolveReports, createReportType, updateReportType, deleteReportType, type TargetType } from "@/lib/reports";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

// ── Membro: denunciar ──────────────────────────────────────────────────────

export async function reportContentAction(targetType: TargetType, targetId: number, reportTypeId: number, message: string): Promise<Result> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login para denunciar." };
  }
  if (targetType !== "article" && targetType !== "comment") return { ok: false, error: "Alvo inválido." };
  const res = await createReport(Number(user.id), targetType, targetId, Math.floor(Number(reportTypeId) || 0), String(message ?? ""));
  return res;
}

// ── Moderador: resolver ────────────────────────────────────────────────────

export async function resolveReportAction(targetType: TargetType, targetId: number, decision: "completed" | "rejected"): Promise<Result> {
  const user = await getCurrentUser();
  if (!can.moderate(user)) return { ok: false, error: "Acesso restrito." };
  if (decision !== "completed" && decision !== "rejected") return { ok: false, error: "Decisão inválida." };
  const res = await resolveReports(targetType, targetId, decision, Number(user!.id));
  if (res.ok) {
    await db.insert(auditLog).values({ actorId: Number(user!.id), action: `report_${decision}`, target: `${targetType}:${targetId}` });
    revalidatePath("/admin/denuncias");
  }
  return res;
}

// ── Admin: tipos de denúncia ───────────────────────────────────────────────

function parseType(body: string): { title: string; completedNotification: string; rejectedNotification: string } | null {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const title = String(p.title ?? "").trim();
    if (title.length < 1 || title.length > 120) return null;
    return {
      title,
      completedNotification: String(p.completedNotification ?? "").slice(0, 4000),
      rejectedNotification: String(p.rejectedNotification ?? "").slice(0, 4000),
    };
  } catch {
    return null;
  }
}

export async function createReportTypeAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseType(body);
  if (!input) return { ok: false, error: "Dados inválidos." };
  const id = await createReportType(input);
  if (!id) return { ok: false, error: "Falha ao criar." };
  revalidatePath("/admin/denuncias");
  return { ok: true, data: { id } };
}

export async function updateReportTypeAction(id: number, body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseType(body);
  if (!input) return { ok: false, error: "Dados inválidos." };
  if (!(await updateReportType(id, input))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/denuncias");
  return { ok: true };
}

export async function deleteReportTypeAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteReportType(id))) return { ok: false, error: "Falha ao excluir." };
  revalidatePath("/admin/denuncias");
  return { ok: true };
}

export async function saveReportingSettingsAction(body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    await setSetting("reporting", sanitizeReportingSettings(JSON.parse(body)));
    revalidatePath("/admin/denuncias");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}
