"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { logModAction } from "@/lib/panel";
import { createPage, deletePage, getPageById, updatePage, uniquePageSlug, validateLayout, validateSection, createBlock, deleteBlock, type Layout } from "@/lib/pages";
import { slugify } from "@/lib/utils";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

let seedCounter = 0;
const sid = () => `s${Date.now().toString(36)}${(seedCounter++).toString(36)}`;

/** Layout que reproduz a home estática (herói + grade de consoles) de forma editável. */
function defaultHomeLayout(): Layout {
  return {
    sections: [
      {
        id: sid(),
        bg: "particles",
        fxParams: {},
        full: true,
        padY: "lg",
        anim: "up",
        gradFrom: "#10b981",
        gradTo: "#6366f1",
        columns: [
          {
            id: sid(),
            span: 12,
            valign: "center",
            bg: "none",
            widgets: [
              { type: "heading", level: 2, text: "O catálogo e os guias de emulação portátil, feitos pela comunidade", align: "center", color: "default", fx: "gradient" },
              { type: "text", text: "Fichas técnicas, comparador, tutoriais e firmware num só lugar, com curadoria.", align: "center", color: "muted" },
              { type: "button", label: "Explorar guias", href: "/guias", variant: "primary", align: "center" },
              { type: "button", label: "Comparar consoles", href: "/consoles/comparar", variant: "outline", align: "center" },
            ],
          },
        ],
      },
      {
        id: sid(),
        bg: "none",
        fxParams: {},
        full: false,
        padY: "md",
        anim: "none",
        gradFrom: "#10b981",
        gradTo: "#6366f1",
        columns: [
          {
            id: sid(),
            span: 12,
            valign: "top",
            bg: "none",
            widgets: [
              { type: "deviceGrid", title: "Consoles", limit: 0, showAll: true },
            ],
          },
        ],
      },
    ],
  };
}

/** Abre (ou cria) a página inicial editável. Idempotente: reaproveita uma página
 *  já marcada como inicial — ou uma "pagina-inicial" semeada antes — e garante
 *  que ela seja a home (isHome + publicada), em vez de criar uma página solta. */
export async function seedHomePageAction(): Promise<Result<{ id: number }>> {
  const actor = await admin();
  if (!actor) return { ok: false, error: "Acesso restrito." };

  const { getHomePageAny, getPageBySlug, setPageAsHome } = await import("@/lib/pages");

  // 1) já existe uma página inicial (qualquer status)? abre ela.
  // 2) senão, uma página semeada antes (slug pagina-inicial)? reaproveita e marca.
  const existing = (await getHomePageAny()) ?? (await getPageBySlug("pagina-inicial"));
  if (existing) {
    if (!existing.isHome) {
      await setPageAsHome(existing.id);
      revalidatePath("/", "layout");
      revalidatePath("/admin/paginas");
    }
    return { ok: true, data: { id: existing.id } };
  }

  // 3) cria a página inicial já publicada e marcada como home.
  const layout = validateLayout(defaultHomeLayout());
  if (!layout) return { ok: false, error: "Falha ao montar o layout inicial." };

  const slug = await uniquePageSlug("pagina-inicial");
  const id = await createPage({ slug, title: "Página Inicial", createdById: Number(actor.id) });
  if (!id) return { ok: false, error: "Falha ao criar a página." };

  await updatePage(id, {
    title: "Página Inicial",
    slug,
    metaDescription: "",
    layout,
    status: "published",
    showInMenu: false,
    menuOrder: 0,
    noindex: false,
    isHome: true, // passa a ser a home em / imediatamente
  });
  await logModAction(Number(actor.id), "page_create", `page:${id}`, { home_seed: true });
  revalidatePath("/admin/paginas");
  revalidatePath("/", "layout");
  return { ok: true, data: { id } };
}

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
  const isHome = Boolean(p.isHome);
  const ok = await updatePage(id, {
    title,
    slug,
    metaDescription: String(p.metaDescription ?? "").slice(0, 320),
    layout,
    status,
    showInMenu: Boolean(p.showInMenu),
    menuOrder: Math.max(0, Math.min(999, Number(p.menuOrder) || 0)),
    noindex: Boolean(p.noindex),
    isHome,
  });
  if (!ok) return { ok: false, error: "Falha ao salvar." };

  await logModAction(Number(actor.id), "page_update", `page:${id}`, { status });
  revalidatePath("/admin/paginas");
  revalidatePath(`/p/${slug}`);
  revalidatePath("/", "layout"); // menu/home podem ter mudado
  if (isHome) revalidatePath("/");
  return { ok: true };
}

/** Salva uma seção como bloco reutilizável. `section` é JSON serializado. */
export async function saveBlockAction(name: string, section: string): Promise<Result<{ id: number }>> {
  const actor = await admin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const nm = String(name ?? "").trim();
  if (nm.length < 2) return { ok: false, error: "Dê um nome ao bloco." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(section);
  } catch {
    return { ok: false, error: "Dados inválidos." };
  }
  const sec = validateSection(parsed);
  if (!sec) return { ok: false, error: "Seção inválida." };
  const id = await createBlock(nm, sec, Number(actor.id));
  if (!id) return { ok: false, error: "Falha ao salvar o bloco." };
  await logModAction(Number(actor.id), "page_block_create", `block:${id}`);
  revalidatePath("/construtor", "layout");
  return { ok: true, data: { id } };
}

export async function deleteBlockAction(id: number): Promise<Result> {
  const actor = await admin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const ok = await deleteBlock(id);
  if (!ok) return { ok: false, error: "Falha ao excluir." };
  revalidatePath("/construtor", "layout");
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
