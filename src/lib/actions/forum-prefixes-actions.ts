"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { forumPrefixes, forumTopics } from "@/db/schema";
import { FORUM_PREFIX_COLORS } from "@/lib/forum-prefix-style";
import { requireRole } from "@/lib/auth-helpers";
import { slugify } from "@/lib/utils";

type Result = { ok: boolean; error?: string; data?: { id: number } };

async function admin() {
  try { return await requireRole("admin"); } catch { return null; }
}

const Schema = z.object({
  id: z.number().int().positive().optional(),
  label: z.string().trim().min(2, "Rótulo muito curto.").max(40),
  color: z.enum(FORUM_PREFIX_COLORS),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export async function savePrefixAction(input: unknown): Promise<Result> {
  if (!(await admin())) return { ok: false, error: "Acesso restrito." };
  const p = Schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Dados inválidos." };

  const slug = slugify(p.data.label).slice(0, 60) || "prefixo";
  const values = { label: p.data.label, color: p.data.color, sortOrder: p.data.sortOrder ?? 0 };

  if (p.data.id) {
    await db.update(forumPrefixes).set(values).where(eq(forumPrefixes.id, p.data.id));
    revalidatePath("/admin/forum");
    return { ok: true, data: { id: p.data.id } };
  }
  // slug único: acrescenta sufixo se colidir.
  let finalSlug = slug;
  for (let i = 2; i <= 50; i++) {
    const [dup] = await db.select({ id: forumPrefixes.id }).from(forumPrefixes).where(eq(forumPrefixes.slug, finalSlug)).limit(1);
    if (!dup) break;
    finalSlug = `${slug}-${i}`.slice(0, 60);
  }
  const ins = await db.insert(forumPrefixes).values({ ...values, slug: finalSlug });
  const id = (ins as unknown as [{ insertId: number }])[0].insertId;
  revalidatePath("/admin/forum");
  return { ok: true, data: { id } };
}

export async function deletePrefixAction(id: number): Promise<Result> {
  if (!(await admin())) return { ok: false, error: "Acesso restrito." };
  await db.delete(forumPrefixes).where(eq(forumPrefixes.id, id));
  // Solta os tópicos que usavam este prefixo (evita referência órfã).
  await db.update(forumTopics).set({ prefixId: null }).where(eq(forumTopics.prefixId, id));
  revalidatePath("/admin/forum");
  return { ok: true };
}
