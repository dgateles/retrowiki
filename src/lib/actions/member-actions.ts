"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, auditLog } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";

type Result = { ok: boolean; error?: string };

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

async function audit(actorId: number, action: string, userId: number, meta?: unknown) {
  await db.insert(auditLog).values({ actorId, action, target: `user:${userId}`, meta: meta ?? null });
}

const RoleSchema = z.enum(["member", "contributor", "moderator", "admin"]);

export async function setUserRoleAction(userId: number, role: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (Number(actor.id) === userId) return { ok: false, error: "Você não pode mudar o próprio papel." };

  const parsed = RoleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, error: "Papel inválido." };

  try {
    await db.update(users).set({ role: parsed.data }).where(eq(users.id, userId));
    await audit(Number(actor.id), "user_set_role", userId, { role: parsed.data });
    revalidatePath("/admin/membros");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao alterar o papel." };
  }
}

export async function setUserSuspendedAction(userId: number, suspended: boolean): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (Number(actor.id) === userId) return { ok: false, error: "Você não pode suspender a própria conta." };

  try {
    await db.update(users).set({ isSuspended: suspended }).where(eq(users.id, userId));
    await audit(Number(actor.id), suspended ? "user_suspend" : "user_unsuspend", userId);
    revalidatePath("/admin/membros");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao atualizar." };
  }
}

export async function setUserTrustedAction(userId: number, trusted: boolean): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };

  try {
    await db.update(users).set({ trusted }).where(eq(users.id, userId));
    await audit(Number(actor.id), trusted ? "user_trust" : "user_untrust", userId);
    revalidatePath("/admin/membros");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao atualizar." };
  }
}
