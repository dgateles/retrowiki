"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, auditLog } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { awardBadgeBySlug, revokeBadgeBySlug, recalcAllBadges, createBadge, updateBadge, deleteBadge } from "@/lib/badges";
import { isBunnyUrl } from "@/lib/bunny";

type Result<T = unknown> = { ok: boolean; error?: string; message?: string; data?: T };

const TIERS = ["bronze", "silver", "gold"] as const;

function parseBadge(body: string): { name: string; description: string; icon: string; image: string | null; tier: (typeof TIERS)[number]; manuallyAwardable: boolean } | null {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const name = String(p.name ?? "").trim();
    if (name.length < 2 || name.length > 120) return null;
    const description = String(p.description ?? "").trim().slice(0, 300);
    const icon = /^[A-Za-z0-9]{1,40}$/.test(String(p.icon)) ? String(p.icon) : "Award";
    const img = String(p.image ?? "").trim();
    const image = img && isBunnyUrl(img) ? img : null;
    const tier = (TIERS as readonly string[]).includes(String(p.tier)) ? (String(p.tier) as (typeof TIERS)[number]) : "bronze";
    return { name, description, icon, image, tier, manuallyAwardable: Boolean(p.manuallyAwardable) };
  } catch {
    return null;
  }
}

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

export async function createBadgeAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const p = parseBadge(body);
  if (!p) return { ok: false, error: "Dados inválidos." };
  const id = await createBadge(p);
  if (!id) return { ok: false, error: "Falha ao criar." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "badge_create", target: `badge:${id}` });
  revalidatePath("/admin/badges");
  return { ok: true, data: { id } };
}

export async function updateBadgeAction(id: number, body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const p = parseBadge(body);
  if (!p) return { ok: false, error: "Dados inválidos." };
  const ok = await updateBadge(id, p);
  if (!ok) return { ok: false, error: "Falha ao salvar." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "badge_update", target: `badge:${id}` });
  revalidatePath("/admin/badges");
  revalidatePath(`/admin/badges/${id}`);
  return { ok: true };
}

export async function deleteBadgeAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const ok = await deleteBadge(id);
  if (!ok) return { ok: false, error: "Falha ao excluir." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "badge_delete", target: `badge:${id}` });
  revalidatePath("/admin/badges");
  return { ok: true };
}
