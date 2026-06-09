"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ranks, auditLog } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { isBunnyUrl } from "@/lib/bunny";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

type Parsed = { title: string; points: number; icon: string; image: string | null };

function parse(body: string): Parsed | null {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const title = String(p.title ?? "").trim();
    if (title.length < 2 || title.length > 80) return null;
    const points = Math.max(0, Math.min(10_000_000, Math.floor(Number(p.points) || 0)));
    const icon = /^[A-Za-z0-9]{1,40}$/.test(String(p.icon)) ? String(p.icon) : "Shield";
    const img = String(p.image ?? "").trim();
    const image = img && isBunnyUrl(img) ? img : null;
    return { title, points, icon, image };
  } catch {
    return null;
  }
}

export async function createRankAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const p = parse(body);
  if (!p) return { ok: false, error: "Dados inválidos." };
  try {
    const [res] = await db.insert(ranks).values({ title: p.title, points: p.points, icon: p.icon, image: p.image, sortOrder: p.points });
    const id = (res as unknown as { insertId: number }).insertId;
    await db.insert(auditLog).values({ actorId: Number(actor.id), action: "rank_create", target: `rank:${id}` });
    revalidatePath("/admin/ranks");
    return { ok: true, data: { id } };
  } catch {
    return { ok: false, error: "Falha ao criar." };
  }
}

export async function updateRankAction(id: number, body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const p = parse(body);
  if (!p) return { ok: false, error: "Dados inválidos." };
  try {
    await db.update(ranks).set({ title: p.title, points: p.points, icon: p.icon, image: p.image, sortOrder: p.points }).where(eq(ranks.id, id));
    await db.insert(auditLog).values({ actorId: Number(actor.id), action: "rank_update", target: `rank:${id}` });
    revalidatePath("/admin/ranks");
    revalidatePath(`/admin/ranks/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}

export async function deleteRankAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    await db.delete(ranks).where(eq(ranks.id, id));
    await db.insert(auditLog).values({ actorId: Number(actor.id), action: "rank_delete", target: `rank:${id}` });
    revalidatePath("/admin/ranks");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao excluir." };
  }
}
