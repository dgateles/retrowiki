"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { createBanFilter, deleteBanFilter, type BanType } from "@/lib/admin/ban-filters";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

const TYPES: BanType[] = ["email", "ip", "name"];

export async function createBanFilterAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const type = (TYPES.includes(String(p.type) as BanType) ? String(p.type) : "email") as BanType;
    const content = String(p.content ?? "").trim().slice(0, 255);
    if (content.length < 1) return { ok: false, error: "Informe o conteúdo." };
    const reason = String(p.reason ?? "").trim().slice(0, 255);
    const id = await createBanFilter(type, content, reason, Number(actor.id));
    if (!id) return { ok: false, error: "Falha ao criar." };
    await db.insert(auditLog).values({ actorId: Number(actor.id), action: "ban_filter_create", target: `ban:${id}`, meta: { type, content } });
    revalidatePath("/admin/banimentos");
    return { ok: true, data: { id } };
  } catch {
    return { ok: false, error: "Dados inválidos." };
  }
}

export async function deleteBanFilterAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteBanFilter(id))) return { ok: false, error: "Falha ao excluir." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "ban_filter_delete", target: `ban:${id}` });
  revalidatePath("/admin/banimentos");
  return { ok: true };
}
