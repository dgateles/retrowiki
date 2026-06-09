"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { promotionRules, auditLog } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { isRole } from "@/lib/admin/role-permissions";
import { sanitizeCriteria, runAllPromotions } from "@/lib/admin/promotions";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T; message?: string };

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

function parsePayload(body: string): { name: string; enabled: boolean; targetRole: string; criteria: unknown; sortOrder: number } | null {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const name = String(p.name ?? "").trim();
    if (name.length < 2 || name.length > 120) return null;
    if (!isRole(String(p.targetRole))) return null;
    return {
      name,
      enabled: Boolean(p.enabled),
      targetRole: String(p.targetRole),
      criteria: p.criteria,
      sortOrder: Math.max(0, Math.floor(Number(p.sortOrder) || 0)),
    };
  } catch {
    return null;
  }
}

export async function createRuleAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const p = parsePayload(body);
  if (!p) return { ok: false, error: "Dados inválidos." };

  try {
    const [res] = await db.insert(promotionRules).values({
      name: p.name,
      enabled: p.enabled,
      sortOrder: p.sortOrder,
      criteria: sanitizeCriteria(p.criteria),
      targetRole: p.targetRole,
    });
    const id = (res as unknown as { insertId: number }).insertId;
    await db.insert(auditLog).values({ actorId: Number(actor.id), action: "promotion_rule_create", target: `rule:${id}` });
    revalidatePath("/admin/promocoes");
    return { ok: true, data: { id } };
  } catch {
    return { ok: false, error: "Falha ao criar." };
  }
}

export async function updateRuleAction(id: number, body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const p = parsePayload(body);
  if (!p) return { ok: false, error: "Dados inválidos." };

  try {
    await db
      .update(promotionRules)
      .set({ name: p.name, enabled: p.enabled, sortOrder: p.sortOrder, criteria: sanitizeCriteria(p.criteria), targetRole: p.targetRole })
      .where(eq(promotionRules.id, id));
    await db.insert(auditLog).values({ actorId: Number(actor.id), action: "promotion_rule_update", target: `rule:${id}` });
    revalidatePath("/admin/promocoes");
    revalidatePath(`/admin/promocoes/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}

export async function deleteRuleAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    await db.delete(promotionRules).where(eq(promotionRules.id, id));
    await db.insert(auditLog).values({ actorId: Number(actor.id), action: "promotion_rule_delete", target: `rule:${id}` });
    revalidatePath("/admin/promocoes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao excluir." };
  }
}

export async function runPromotionsAction(): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const changed = await runAllPromotions(Number(actor.id));
  revalidatePath("/admin/promocoes");
  return { ok: true, message: `${changed} membro(s) promovido(s).` };
}
