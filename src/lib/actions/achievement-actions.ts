"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { achievementRules, auditLog } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { isTrigger, sanitizeRewards } from "@/lib/achievements";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

type Parsed = { name: string; trigger: string; milestone: number; enabled: boolean; sortOrder: number; rewards: unknown };

function parse(body: string): Parsed | null {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const name = String(p.name ?? "").trim();
    if (name.length < 2 || name.length > 120) return null;
    if (!isTrigger(String(p.trigger))) return null;
    return {
      name,
      trigger: String(p.trigger),
      milestone: Math.max(0, Math.floor(Number(p.milestone) || 0)),
      enabled: Boolean(p.enabled),
      sortOrder: Math.max(0, Math.floor(Number(p.sortOrder) || 0)),
      rewards: p.rewards,
    };
  } catch {
    return null;
  }
}

export async function createRuleAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const p = parse(body);
  if (!p) return { ok: false, error: "Dados inválidos." };
  try {
    const [res] = await db.insert(achievementRules).values({
      name: p.name,
      trigger: p.trigger,
      milestone: p.milestone,
      enabled: p.enabled,
      sortOrder: p.sortOrder,
      rewards: sanitizeRewards(p.trigger, p.rewards),
    });
    const id = (res as unknown as { insertId: number }).insertId;
    await db.insert(auditLog).values({ actorId: Number(actor.id), action: "achievement_rule_create", target: `arule:${id}` });
    revalidatePath("/admin/regras");
    return { ok: true, data: { id } };
  } catch {
    return { ok: false, error: "Falha ao criar." };
  }
}

export async function updateRuleAction(id: number, body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const p = parse(body);
  if (!p) return { ok: false, error: "Dados inválidos." };
  try {
    await db
      .update(achievementRules)
      .set({ name: p.name, trigger: p.trigger, milestone: p.milestone, enabled: p.enabled, sortOrder: p.sortOrder, rewards: sanitizeRewards(p.trigger, p.rewards) })
      .where(eq(achievementRules.id, id));
    await db.insert(auditLog).values({ actorId: Number(actor.id), action: "achievement_rule_update", target: `arule:${id}` });
    revalidatePath("/admin/regras");
    revalidatePath(`/admin/regras/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}

export async function deleteRuleAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    await db.delete(achievementRules).where(eq(achievementRules.id, id));
    await db.insert(auditLog).values({ actorId: Number(actor.id), action: "achievement_rule_delete", target: `arule:${id}` });
    revalidatePath("/admin/regras");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao excluir." };
  }
}
