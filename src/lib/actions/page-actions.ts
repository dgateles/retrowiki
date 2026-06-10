"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { logModAction } from "@/lib/panel";
import { createPage, deletePage, getPageById, updatePage, uniquePageSlug, validateLayout } from "@/lib/pages";
import { slugify } from "@/lib/utils";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

async function admin() {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

export async function createPageAction(title: string): Promise<Result<{ id: number }>> {
  const actor = await admin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const t = String(title ?? "").trim();
  if (t.length < 3) return { ok: false, error: "Dê um título (mínimo 3 caracteres)." };
  const slug = await uniquePageSlug(t);
  const id = await createPage({ slug, title: t, createdById: Number(actor.id) });
  if (!id) return { ok: false, error: "Falha ao criar a página." };
  await logModAction(Number(actor.id), "page_create", `page:${id}`);
  revalidatePath("/admin/paginas");
  return { ok: true, data: { id } };
}

/** Salva a página. `payload` é JSON serializado (o layout vai como string para
 * não virar client reference ao cruzar a fronteira da server action). */
export async function savePageAction(id: number, payload: string): Promise<Result> {
  const actor = await admin();
  if (!actor) return { ok: false, error: "Acesso restrito." };

  const existing = await getPageById(id);
  if (!existing) return { ok: false, error: "Página não encontrada." };

  let p: Record<string, unknown>;
  try {
    p = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Dados inválidos." };
  }

  const title = String(p.title ?? "").trim();
  if (title.length < 3) return { ok: false, error: "Título muito curto." };

  // Slug: usa o informado (slugificado) ou mantém o atual; garante unicidade.
  let slug = slugify(String(p.slug ?? "")).slice(0, 120);
  if (!slug) slug = existing.slug;
  if (slug !== existing.slug) slug = await uniquePageSlug(slug);

  const layout = validateLayout(p.layout);
  if (!layout) return { ok: false, error: "Layout inválido (algum widget não é permitido)." };

  const status = p.status === "published" ? "published" : "draft";
  const ok = await updatePage(id, {
    title,
    slug,
    metaDescription: String(p.metaDescription ?? "").slice(0, 320),
    layout,
    status,
    showInMenu: Boolean(p.showInMenu),
    menuOrder: Math.max(0, Math.min(999, Number(p.menuOrder) || 0)),
    noindex: Boolean(p.noindex),
  });
  if (!ok) return { ok: false, error: "Falha ao salvar." };

  await logModAction(Number(actor.id), "page_update", `page:${id}`, { status });
  revalidatePath("/admin/paginas");
  revalidatePath(`/p/${slug}`);
  revalidatePath("/", "layout"); // menu pode ter mudado
  return { ok: true };
}

export async function deletePageAction(id: number): Promise<Result> {
  const actor = await admin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const ok = await deletePage(id);
  if (!ok) return { ok: false, error: "Falha ao excluir." };
  await logModAction(Number(actor.id), "page_delete", `page:${id}`);
  revalidatePath("/admin/paginas");
  revalidatePath("/", "layout");
  return { ok: true };
}
