"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { forumCategories, forums, forumTopics } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { logModAction } from "@/lib/panel";
import { uniqueForumSlug } from "@/lib/forum";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

async function admin() {
  try { return await requireRole("admin"); } catch { return null; }
}
function refresh() {
  revalidatePath("/admin/forum");
  revalidatePath("/forum");
}

const ROLES = ["member", "contributor", "moderator", "admin"] as const;

// ── Categorias ─────────────────────────────────────────────────────────────
const CategorySchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).optional(),
  visible: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});
export async function saveForumCategoryAction(input: unknown): Promise<Result<{ id: number }>> {
  const actor = await admin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const p = CategorySchema.safeParse(input);
  if (!p.success) return { ok: false, error: "Dados inválidos." };
  const v = p.data;
  if (v.id) {
    await db.update(forumCategories).set({ title: v.title, description: v.description ?? null, visible: v.visible ?? true, sortOrder: v.sortOrder ?? 0 }).where(eq(forumCategories.id, v.id));
    refresh();
    return { ok: true, data: { id: v.id } };
  }
  const ins = await db.insert(forumCategories).values({ title: v.title, description: v.description ?? null });
  const id = (ins as unknown as [{ insertId: number }])[0].insertId;
  await logModAction(Number(actor.id), "forum_category_create", `forum_category:${id}`);
  refresh();
  return { ok: true, data: { id } };
}
export async function deleteForumCategoryAction(id: number): Promise<Result> {
  const actor = await admin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const [f] = await db.select({ id: forums.id }).from(forums).where(eq(forums.categoryId, id)).limit(1);
  if (f) return { ok: false, error: "Remova ou mova os fóruns desta categoria primeiro." };
  await db.delete(forumCategories).where(eq(forumCategories.id, id));
  refresh();
  return { ok: true };
}

// ── Fóruns ─────────────────────────────────────────────────────────────────
const ForumSchema = z.object({
  id: z.number().int().positive().optional(),
  categoryId: z.number().int().positive(),
  parentId: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).optional(),
  icon: z.string().trim().max(40).optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
  minReadRole: z.enum(ROLES).optional(),
  minPostRole: z.enum(ROLES).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});
export async function saveForumAction(input: unknown): Promise<Result<{ id: number }>> {
  const actor = await admin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const p = ForumSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "Dados inválidos." };
  const v = p.data;
  // Sub-fórum: só 1 nível (o pai precisa ser um fórum de topo) e não pode ser ele mesmo.
  const parentId: number | null = v.parentId ?? null;
  if (parentId != null) {
    if (parentId === v.id) return { ok: false, error: "Um fórum não pode ser pai de si mesmo." };
    const [parent] = await db.select({ id: forums.id, parentId: forums.parentId }).from(forums).where(eq(forums.id, parentId)).limit(1);
    if (!parent) return { ok: false, error: "Fórum pai inválido." };
    if (parent.parentId != null) return { ok: false, error: "Sub-fóruns só podem ter um nível de profundidade." };
    if (v.id) {
      const [child] = await db.select({ id: forums.id }).from(forums).where(eq(forums.parentId, v.id)).limit(1);
      if (child) return { ok: false, error: "Este fórum já tem sub-fóruns; não pode virar sub-fórum." };
    }
  }
  const base = {
    categoryId: v.categoryId, parentId, title: v.title, description: v.description ?? null, icon: v.icon || null,
    visible: v.visible ?? true, locked: v.locked ?? false,
    minReadRole: v.minReadRole ?? "member", minPostRole: v.minPostRole ?? "member", sortOrder: v.sortOrder ?? 0,
  } as const;
  if (v.id) {
    await db.update(forums).set(base).where(eq(forums.id, v.id));
    refresh();
    return { ok: true, data: { id: v.id } };
  }
  const slug = await uniqueForumSlug(v.title);
  const ins = await db.insert(forums).values({ ...base, slug });
  const id = (ins as unknown as [{ insertId: number }])[0].insertId;
  await logModAction(Number(actor.id), "forum_create", `forum:${id}`);
  refresh();
  return { ok: true, data: { id } };
}
export async function deleteForumAction(id: number): Promise<Result> {
  const actor = await admin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const [t] = await db.select({ id: forumTopics.id }).from(forumTopics).where(and(eq(forumTopics.forumId, id), isNull(forumTopics.deletedAt))).limit(1);
  if (t) return { ok: false, error: "Este fórum tem tópicos. Oculte-o em vez de excluir." };
  await db.delete(forums).where(eq(forums.id, id));
  await logModAction(Number(actor.id), "forum_delete", `forum:${id}`);
  refresh();
  return { ok: true };
}
