import "server-only";
import { z } from "zod";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { parseVideoEmbed } from "@/lib/video-embed";
import { ICON_KEYS } from "@/lib/page-icons";
import { RichDocSchema } from "@/lib/blocks/rich-schema";

// ── Allowlist do layout (seções → colunas → widgets) ────────────────────────
// Fonte da verdade da segurança: o que não está aqui é descartado. Nada de
// HTML cru, scripts ou CSS arbitrário; tudo é renderizado via JSX.

const url = z.string().trim().max(500).refine(
  (u) => u === "" || /^(https?:\/\/|\/|#)/i.test(u),
  "URL inválida.",
);
const imageUrl = z.string().trim().max(500).refine(
  (u) => u === "" || /^(https:\/\/|\/)/i.test(u),
  "Imagem deve vir de uma URL https.",
);
const ALIGN = z.enum(["left", "center", "right"]).default("left");
const COLOR = z.enum(["default", "muted", "primary", "success", "warn"]).default("default").catch("default");

const WidgetSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2), text: z.string().trim().min(1).max(200), align: ALIGN, color: COLOR, fx: z.enum(["none", "gradient", "aurora", "shiny", "textanimate", "typing", "lineshadow", "hyper"]).default("none").catch("none") }),
  z.object({ type: z.literal("text"), text: z.string().max(5000), align: ALIGN, color: COLOR }),
  z.object({ type: z.literal("image"), url: imageUrl, alt: z.string().max(200).default(""), caption: z.string().max(200).default("") }),
  z.object({ type: z.literal("button"), label: z.string().trim().min(1).max(80), href: url, variant: z.enum(["primary", "outline", "rainbow"]).default("primary"), align: ALIGN }),
  z.object({ type: z.literal("divider") }),
  z.object({ type: z.literal("spacer"), size: z.enum(["sm", "md", "lg"]).default("md") }),
  z.object({ type: z.literal("video"), url: z.string().trim().max(500).refine((u) => parseVideoEmbed(u) !== null, "Use uma URL do YouTube ou Vimeo.") }),
  z.object({ type: z.literal("callout"), tone: z.enum(["info", "warn", "success"]).default("info"), text: z.string().trim().min(1).max(2000) }),
  z.object({
    type: z.literal("accordion"),
    items: z.array(z.object({ title: z.string().trim().min(1).max(200), body: z.string().max(3000) })).min(1).max(15),
  }),
  z.object({
    type: z.literal("gallery"),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
    images: z.array(z.object({ url: imageUrl, alt: z.string().max(200).default("") })).min(1).max(24),
  }),
  z.object({
    type: z.literal("card"),
    image: imageUrl.optional().default(""),
    title: z.string().trim().min(1).max(200),
    text: z.string().max(2000).default(""),
    href: url.optional().default(""),
    buttonLabel: z.string().max(80).default(""),
    // Efeito de borda/realce (Magic UI / React Bits).
    effect: z.enum(["none", "beam", "shine", "magic", "glare"]).default("none").catch("none"),
  }),
  z.object({
    type: z.literal("iconList"),
    items: z.array(z.object({ icon: z.enum(ICON_KEYS), text: z.string().trim().min(1).max(300) })).min(1).max(15),
  }),
  // Texto rico: reaproveita o editor (Rico/Markdown/HTML) e a allowlist de blocos.
  z.object({ type: z.literal("richtext"), doc: RichDocSchema }),
  // Grade dinâmica de consoles (puxa o catálogo publicado em tempo real).
  z.object({
    type: z.literal("deviceGrid"),
    title: z.string().max(120).default("Consoles"),
    limit: z.number().int().min(0).max(48).default(0),
    showAll: z.boolean().default(true),
  }),
  // Contador animado (Number Ticker) — números que sobem ao entrar na tela.
  z.object({
    type: z.literal("numberTicker"),
    value: z.number().min(0).max(1_000_000_000).default(100),
    prefix: z.string().max(8).default(""),
    suffix: z.string().max(8).default(""),
    label: z.string().max(80).default(""),
    align: ALIGN,
  }),
  // Marquee — faixa de texto em rolagem infinita.
  z.object({
    type: z.literal("marquee"),
    items: z.array(z.object({ text: z.string().trim().min(1).max(120) })).min(1).max(30),
    reverse: z.boolean().default(false),
    pauseOnHover: z.boolean().default(true),
  }),
  // Bento Grid — destaques em cartões de tamanhos variados.
  z.object({
    type: z.literal("bento"),
    items: z.array(z.object({
      icon: z.enum(ICON_KEYS).default("check"),
      title: z.string().trim().min(1).max(120),
      description: z.string().max(300).default(""),
      href: url.optional().default(""),
      wide: z.boolean().default(false),
    })).min(1).max(12),
  }),
  // Lista animada — itens que surgem em sequência (estilo notificações).
  z.object({
    type: z.literal("animatedList"),
    items: z.array(z.object({
      icon: z.enum(ICON_KEYS).default("check"),
      title: z.string().trim().min(1).max(120),
      description: z.string().max(200).default(""),
    })).min(1).max(20),
  }),
  // Lista de downloads (versão, tamanho, data, changelog, checksum SHA256).
  z.object({
    type: z.literal("download"),
    items: z.array(z.object({
      name: z.string().trim().min(1).max(120),
      version: z.string().max(40).default(""),
      url: url,
      size: z.string().max(40).default(""),
      date: z.string().max(40).default(""),
      changelogUrl: url.optional().default(""),
      checksum: z.string().max(200).default(""),
    })).min(1).max(40),
  }),
  // Lista de firmwares (link para releases do GitHub ou site externo).
  z.object({
    type: z.literal("firmware"),
    items: z.array(z.object({
      name: z.string().trim().min(1).max(120),
      description: z.string().max(300).default(""),
      owner: z.string().max(80).default(""),
      repo: z.string().max(120).default(""),
      website: url.optional().default(""),
      deprecated: z.boolean().default(false),
    })).min(1).max(40),
  }),
  // Guia de compra: lojas (nível de confiança), acessórios e dicas.
  z.object({
    type: z.literal("buyingGuide"),
    consoleName: z.string().trim().min(1).max(120),
    priceRange: z.string().max(80).default(""),
    stores: z.array(z.object({ name: z.string().trim().min(1).max(120), description: z.string().max(300).default(""), href: url, trustLevel: z.enum(["verified", "trusted", "caution", "choice"]).default("trusted"), badge: z.string().max(40).default("") })).max(20).default([]),
    accessories: z.array(z.object({ name: z.string().trim().min(1).max(120), description: z.string().max(300).default(""), href: url, category: z.enum(["storage", "connectivity", "protection", "other"]).default("other"), badge: z.string().max(40).default("") })).max(20).default([]),
    tips: z.array(z.object({ title: z.string().trim().min(1).max(120), description: z.string().max(400).default(""), type: z.enum(["tip", "warning"]).default("tip") })).max(15).default([]),
  }),
]);
export type Widget = z.infer<typeof WidgetSchema>;
export type WidgetType = Widget["type"];

// Largura da coluna numa grade de 12. Compat: aceita o antigo enum `width`.
const WIDTH_TO_SPAN: Record<string, number> = { full: 12, "1/2": 6, "1/3": 4, "2/3": 8, "1/4": 3, "3/4": 9 };
const ColumnSchema = z.preprocess(
  (c) => {
    if (c && typeof c === "object" && !("span" in c) && "width" in c) {
      const w = (c as { width?: string }).width;
      return { ...(c as object), span: (w && WIDTH_TO_SPAN[w]) || 12 };
    }
    return c;
  },
  z.object({
    id: z.string().max(40),
    span: z.number().int().min(1).max(12).catch(12).default(12),
    valign: z.enum(["top", "center", "bottom"]).default("top").catch("top"),
    bg: z.enum(["none", "muted", "card"]).default("none").catch("none"),
    widgets: z.array(WidgetSchema).max(30),
  }),
);
export type Column = z.infer<typeof ColumnSchema>;

const SectionSchema = z.object({
  id: z.string().max(40),
  bg: z.enum(["none", "muted", "card", "primary", "dark", "gradient", "particles", "retrogrid", "meteors", "dots", "ripple", "flickering", "animgrid", "interactivegrid", "hexagon", "striped", "lightrays"]).default("none").catch("none"),
  // Largura total: a seção (e o fundo) ocupam a largura do viewport (full-bleed).
  full: z.boolean().default(false).catch(false),
  padY: z.enum(["none", "sm", "md", "lg"]).default("none").catch("none"),
  anim: z.enum(["none", "fade", "up", "left", "right", "zoom", "blur"]).default("none").catch("none"),
  // Cores do gradiente animado (bg "gradient") — hex validado.
  gradFrom: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#10b981").catch("#10b981"),
  gradTo: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1").catch("#6366f1"),
  columns: z.array(ColumnSchema).min(1).max(4),
});
export type Section = z.infer<typeof SectionSchema>;

export const LayoutSchema = z.object({ sections: z.array(SectionSchema).max(40) });
export type Layout = z.infer<typeof LayoutSchema>;

export const EMPTY_LAYOUT: Layout = { sections: [] };

/** Valida e normaliza uma árvore de layout pela allowlist. */
export function validateLayout(raw: unknown): Layout | null {
  const p = LayoutSchema.safeParse(raw);
  return p.success ? p.data : null;
}

/** Valida uma única seção (para blocos reutilizáveis). */
export function validateSection(raw: unknown): Section | null {
  const p = SectionSchema.safeParse(raw);
  return p.success ? p.data : null;
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export type PageRow = typeof pages.$inferSelect;

export async function listPages(): Promise<PageRow[]> {
  try {
    return await db.select().from(pages).orderBy(desc(pages.updatedAt));
  } catch {
    return [];
  }
}

export async function getPageById(id: number): Promise<PageRow | null> {
  try {
    const [p] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
    return p ?? null;
  } catch {
    return null;
  }
}

export async function getPublishedPage(slug: string): Promise<PageRow | null> {
  try {
    const [p] = await db.select().from(pages).where(and(eq(pages.slug, slug), eq(pages.status, "published"))).limit(1);
    return p ?? null;
  } catch {
    return null;
  }
}

/** Página marcada como inicial e publicada (substitui a home estática). */
export async function getHomePage(): Promise<PageRow | null> {
  try {
    const [p] = await db.select().from(pages).where(and(eq(pages.isHome, true), eq(pages.status, "published"))).limit(1);
    return p ?? null;
  } catch {
    return null;
  }
}

/** Páginas publicadas marcadas para aparecer no menu do header. */
export async function getMenuPages(): Promise<{ slug: string; title: string }[]> {
  try {
    return await db
      .select({ slug: pages.slug, title: pages.title })
      .from(pages)
      .where(and(eq(pages.status, "published"), eq(pages.showInMenu, true)))
      .orderBy(asc(pages.menuOrder), asc(pages.title))
      .limit(12);
  } catch {
    return [];
  }
}

export async function createPage(input: { slug: string; title: string; createdById: number }): Promise<number | null> {
  try {
    const [res] = await db.insert(pages).values({
      slug: input.slug,
      title: input.title,
      layout: EMPTY_LAYOUT,
      status: "draft",
      createdById: input.createdById,
    });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function updatePage(
  id: number,
  input: { title: string; slug: string; metaDescription: string; layout: Layout; status: "draft" | "published"; showInMenu: boolean; menuOrder: number; noindex: boolean; isHome: boolean },
): Promise<boolean> {
  try {
    // Apenas uma página pode ser a inicial: ao marcar esta, desmarca as outras.
    if (input.isHome) {
      await db.update(pages).set({ isHome: false }).where(eq(pages.isHome, true));
    }
    await db.update(pages).set(input).where(eq(pages.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deletePage(id: number): Promise<boolean> {
  try {
    await db.delete(pages).where(eq(pages.id, id));
    return true;
  } catch {
    return false;
  }
}

// ── Blocos reutilizáveis ────────────────────────────────────────────────────

export type PageBlockRow = { id: number; name: string; layout: unknown };

export async function listBlocks(): Promise<PageBlockRow[]> {
  try {
    const { pageBlocks } = await import("@/db/schema");
    return await db.select({ id: pageBlocks.id, name: pageBlocks.name, layout: pageBlocks.layout }).from(pageBlocks).orderBy(desc(pageBlocks.createdAt)).limit(60);
  } catch {
    return [];
  }
}

export async function createBlock(name: string, section: Section, createdById: number): Promise<number | null> {
  try {
    const { pageBlocks } = await import("@/db/schema");
    const [res] = await db.insert(pageBlocks).values({ name, layout: section, createdById });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function deleteBlock(id: number): Promise<boolean> {
  try {
    const { pageBlocks } = await import("@/db/schema");
    await db.delete(pageBlocks).where(eq(pageBlocks.id, id));
    return true;
  } catch {
    return false;
  }
}

/** Slug único a partir de uma base. */
export async function uniquePageSlug(base: string): Promise<string> {
  const { slugify } = await import("@/lib/utils");
  let slug = slugify(base).slice(0, 120) || "pagina";
  for (let i = 0; i < 6; i++) {
    const [taken] = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, slug)).limit(1);
    if (!taken) return slug;
    slug = `${slugify(base).slice(0, 110)}-${i + 2}`;
  }
  return `${slug}-${Date.now()}`;
}
