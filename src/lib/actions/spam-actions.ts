"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { setSetting, sanitizeSpamSettings } from "@/lib/settings";
import { createQuestion, updateQuestion, deleteQuestion, upsertGeoRule, deleteGeoRule } from "@/lib/spam";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

export async function saveSpamSettingsAction(body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    await setSetting("spam", sanitizeSpamSettings(JSON.parse(body)));
    revalidatePath("/admin/spam");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}

// ── Perguntas (desafio P&R) ────────────────────────────────────────────────

function parseQuestion(body: string): { question: string; answers: string[] } | null {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const question = String(p.question ?? "").trim();
    if (question.length < 1 || question.length > 255) return null;
    const answers = Array.isArray(p.answers) ? p.answers.map((a) => String(a).trim()).filter(Boolean).slice(0, 50) : [];
    if (answers.length === 0) return null;
    return { question, answers };
  } catch {
    return null;
  }
}

export async function createQuestionAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseQuestion(body);
  if (!input) return { ok: false, error: "Informe a pergunta e ao menos uma resposta." };
  const id = await createQuestion(input);
  if (!id) return { ok: false, error: "Falha ao criar." };
  revalidatePath("/admin/spam");
  return { ok: true, data: { id } };
}

export async function updateQuestionAction(id: number, body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseQuestion(body);
  if (!input) return { ok: false, error: "Dados inválidos." };
  if (!(await updateQuestion(id, input))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/spam");
  return { ok: true };
}

export async function deleteQuestionAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteQuestion(id))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/spam");
  return { ok: true };
}

// ── Regras de geolocalização ───────────────────────────────────────────────

export async function upsertGeoRuleAction(countryCode: string, action: "flag" | "block"): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const cc = String(countryCode ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return { ok: false, error: "Código de país inválido (use 2 letras, ex.: RU)." };
  if (action !== "flag" && action !== "block") return { ok: false, error: "Ação inválida." };
  if (!(await upsertGeoRule(cc, action))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/spam");
  return { ok: true };
}

export async function deleteGeoRuleAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteGeoRule(id))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/spam");
  return { ok: true };
}
