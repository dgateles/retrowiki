"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { stockReplies } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { isRichDoc, RichDocSchema } from "@/lib/blocks/rich-schema";

type Result = { ok: boolean; error?: string; data?: { id: number } };

async function admin() {
  try { return await requireRole("admin"); } catch { return null; }
}

/** Valida e serializa o corpo rico (mesma allowlist do fórum). */
function validBody(raw: string): string | null {
  try {
    const d = JSON.parse(raw);
    if (!isRichDoc(d)) return null;
    const p = RichDocSchema.safeParse(d);
    return p.success ? JSON.stringify(p.data) : null;
  } catch {
    return null;
  }
}

const Schema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(2, "Título muito curto.").max(120),
  body: z.string(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export async function saveStockReplyAction(input: unknown): Promise<Result> {
  if (!(await admin())) return { ok: false, error: "Acesso restrito." };
  const p = Schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Dados inválidos." };
  const body = validBody(p.data.body);
  if (!body) return { ok: false, error: "Corpo da resposta inválido." };
  if (p.data.id) {
    await db.update(stockReplies).set({ title: p.data.title, body, sortOrder: p.data.sortOrder ?? 0 }).where(eq(stockReplies.id, p.data.id));
    revalidatePath("/admin/respostas");
    return { ok: true, data: { id: p.data.id } };
  }
  const ins = await db.insert(stockReplies).values({ title: p.data.title, body, sortOrder: p.data.sortOrder ?? 0 });
  const id = (ins as unknown as [{ insertId: number }])[0].insertId;
  revalidatePath("/admin/respostas");
  return { ok: true, data: { id } };
}

export async function deleteStockReplyAction(id: number): Promise<Result> {
  if (!(await admin())) return { ok: false, error: "Acesso restrito." };
  await db.delete(stockReplies).where(eq(stockReplies.id, id));
  revalidatePath("/admin/respostas");
  return { ok: true };
}
