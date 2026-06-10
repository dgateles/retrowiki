import "server-only";
import { z } from "zod";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { parseVideoEmbed } from "@/lib/video-embed";
import { ICON_KEYS } from "@/lib/page-icons";

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

const WidgetSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2), text: z.string().trim().min(1).max(200), align: ALIGN }),
  z.object({ type: z.literal("text"), text: z.string().max(5000), align: ALIGN }),
  z.object({ type: z.literal("image"), url: imageUrl, alt: z.string().max(200).default(""), caption: z.string().max(200).default("") }),
  z.object({ type: z.literal("button"), label: z.string().trim().min(1).max(80), href: url, variant: z.enum(["primary", "outline"]).default("primary"), align: ALIGN }),
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
  }),
  z.object({
    type: z.literal("iconList"),
    items: z.array(z.object({ icon: z.enum(ICON_KEYS), text: z.string().trim().min(1).max(300) })).min(1).max(15),
  }),
]);
export type Widget = z.infer<typeof WidgetSchema>;
export type WidgetType = Widget["type"];

const ColumnSchema = z.object({
  id: z.string().max(40),
  width: z.enum(["full", "1/2", "1/3", "2/3", "1/4", "3/4"]).default("full"),
  widgets: z.array(WidgetSchema).max(30),
});
export type Column = z.infer<typeof ColumnSchema>;

const SectionSchema = z.object({
  id: z.string().max(40),
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
  input: { title: string; slug: string; metaDescription: string; layout: Layout; status: "draft" | "published"; showInMenu: boolean; menuOrder: number; noindex: boolean },
): Promise<boolean> {
  try {
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
