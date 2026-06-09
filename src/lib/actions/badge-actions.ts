"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, auditLog } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { awardBadgeBySlug, revokeBadgeBySlug, recalcAllBadges } from "@/lib/badges";

type Result = { ok: boolean; error?: string; message?: string };

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

async function userByHandle(handle: string): Promise<{ id: number; handle: string } | null> {
  const h = handle.trim().replace(/^@/, "").toLowerCase();
  if (!h) return null;
  const [u] = await db.select({ id: users.id, handle: users.handle }).from(users).where(eq(users.handle, h)).limit(1);
  return u ?? null;
}

export async function recalculateBadgesAction(): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const { users: changed, awarded } = await recalcAllBadges();
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "badges_recalc", target: "badges:all", meta: { changed, awarded } });
  revalidatePath("/admin/gamificacao");
  return { ok: true, message: `${awarded} conquista(s) concedida(s) a ${changed} usuário(s).` };
}

export async function awardBadgeAction(handle: string, slug: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const u = await userByHandle(handle);
  if (!u) return { ok: false, error: "Usuário não encontrado." };
  const ok = await awardBadgeBySlug(u.id, slug);
  if (!ok) return { ok: false, error: "Badge inválida." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "badge_award", target: `user:${u.id}`, meta: { slug } });
  revalidatePath("/admin/gamificacao");
  revalidatePath(`/u/${u.handle}`);
  return { ok: true, message: `Badge concedida a @${u.handle}.` };
}

export async function revokeBadgeAction(handle: string, slug: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const u = await userByHandle(handle);
  if (!u) return { ok: false, error: "Usuário não encontrado." };
  const ok = await revokeBadgeBySlug(u.id, slug);
  if (!ok) return { ok: false, error: "Badge inválida." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "badge_revoke", target: `user:${u.id}`, meta: { slug } });
  revalidatePath("/admin/gamificacao");
  revalidatePath(`/u/${u.handle}`);
  return { ok: true, message: `Badge removida de @${u.handle}.` };
}
