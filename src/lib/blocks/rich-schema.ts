import { z } from "zod";
import { HEX_COLOR, FONT_SIZES, ALIGNMENTS } from "@/lib/editor/options";

// Validação por allowlist do documento do editor rico (formato ProseMirror/TipTap).
// Só os nós, marcas e atributos abaixo são aceitos; o resto é rejeitado no
// servidor. Cores restritas a hex, tamanhos e alinhamentos a conjuntos fixos.
// Nenhuma URL javascript:, nenhum HTML arbitrário.

const safeHref = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (h) => /^https?:\/\//i.test(h) || h.startsWith("/") || h.startsWith("#") || h.startsWith("mailto:"),
    "URL não permitida",
  );

const align = z.enum(ALIGNMENTS).nullish();

const LinkMark = z.object({
  type: z.literal("link"),
  attrs: z.object({ href: safeHref }).passthrough().transform((a) => ({ href: a.href })),
});

const TextStyleMark = z.object({
  type: z.literal("textStyle"),
  attrs: z
    .object({
      color: z.string().regex(HEX_COLOR).nullish(),
      fontSize: z.enum(FONT_SIZES).nullish(),
    })
    .passthrough()
    .transform((a) => ({ color: a.color ?? null, fontSize: a.fontSize ?? null })),
});

const HighlightMark = z.object({
  type: z.literal("highlight"),
  attrs: z
    .object({ color: z.string().regex(HEX_COLOR).nullish() })
    .passthrough()
    .transform((a) => ({ color: a.color ?? null })),
});

const Mark = z.union([
  z.object({ type: z.literal("bold") }),
  z.object({ type: z.literal("italic") }),
  z.object({ type: z.literal("underline") }),
  z.object({ type: z.literal("strike") }),
  z.object({ type: z.literal("code") }),
  z.object({ type: z.literal("subscript") }),
  z.object({ type: z.literal("superscript") }),
  TextStyleMark,
  HighlightMark,
  LinkMark,
]);

const TextNode = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(8000),
  marks: z.array(Mark).max(8).optional(),
});

const ImageNode = z.object({
  type: z.literal("image"),
  attrs: z
    .object({ src: safeHref, alt: z.string().max(500).nullish() })
    .passthrough()
    .transform((a) => ({ src: a.src, alt: a.alt ?? null })),
});

const cellAttrs = z
  .object({
    colspan: z.coerce.number().int().min(1).max(20).optional(),
    rowspan: z.coerce.number().int().min(1).max(50).optional(),
  })
  .passthrough()
  .transform((a) => ({ colspan: a.colspan ?? 1, rowspan: a.rowspan ?? 1 }))
  .optional();

// Nós recursivos via z.lazy.
export type RichNode =
  | z.infer<typeof TextNode>
  | z.infer<typeof ImageNode>
  | { type: "paragraph"; attrs?: { textAlign?: string | null }; content?: RichNode[] }
  | { type: "heading"; attrs: { level: number; textAlign?: string | null }; content?: RichNode[] }
  | { type: "bulletList"; content?: RichNode[] }
  | { type: "orderedList"; attrs?: { start?: number }; content?: RichNode[] }
  | { type: "listItem"; content?: RichNode[] }
  | { type: "blockquote"; content?: RichNode[] }
  | { type: "box"; attrs?: { title?: string | null; collapsed?: boolean }; content?: RichNode[] }
  | { type: "spoiler"; attrs?: { title?: string | null }; content?: RichNode[] }
  | { type: "codeBlock"; attrs?: { language?: string | null }; content?: RichNode[] }
  | { type: "table"; content?: RichNode[] }
  | { type: "tableRow"; content?: RichNode[] }
  | { type: "tableHeader"; attrs?: { colspan: number; rowspan: number }; content?: RichNode[] }
  | { type: "tableCell"; attrs?: { colspan: number; rowspan: number }; content?: RichNode[] }
  | { type: "horizontalRule" }
  | { type: "hardBreak" };

const arr = () => z.array(Node).max(400).optional();

const Node = z.lazy(() =>
  z.union([
    TextNode,
    ImageNode,
    z.object({ type: z.literal("paragraph"), attrs: z.object({ textAlign: align }).partial().optional(), content: arr() }),
    z.object({
      type: z.literal("heading"),
      attrs: z.object({ level: z.coerce.number().int().min(1).max(6), textAlign: align }),
      content: arr(),
    }),
    z.object({ type: z.literal("bulletList"), content: arr() }),
    z.object({ type: z.literal("orderedList"), attrs: z.object({ start: z.coerce.number().int().min(1).optional() }).optional(), content: arr() }),
    z.object({ type: z.literal("listItem"), content: arr() }),
    z.object({ type: z.literal("blockquote"), content: arr() }),
    z.object({
      type: z.literal("box"),
      attrs: z.object({ title: z.string().max(200).nullish(), collapsed: z.boolean().nullish() }).partial().optional(),
      content: arr(),
    }),
    z.object({
      type: z.literal("spoiler"),
      attrs: z.object({ title: z.string().max(200).nullish() }).partial().optional(),
      content: arr(),
    }),
    z.object({ type: z.literal("codeBlock"), attrs: z.object({ language: z.string().max(20).nullish() }).optional(), content: arr() }),
    z.object({ type: z.literal("table"), content: arr() }),
    z.object({ type: z.literal("tableRow"), content: arr() }),
    z.object({ type: z.literal("tableHeader"), attrs: cellAttrs, content: arr() }),
    z.object({ type: z.literal("tableCell"), attrs: cellAttrs, content: arr() }),
    z.object({ type: z.literal("horizontalRule") }),
    z.object({ type: z.literal("hardBreak") }),
  ]),
) as unknown as z.ZodType<RichNode>;

export const RichDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(Node).min(1).max(1000),
});

export type RichDoc = z.infer<typeof RichDocSchema>;

export function isRichDoc(body: unknown): body is RichDoc {
  return !!body && typeof body === "object" && (body as { type?: unknown }).type === "doc";
}

/** Extrai texto puro de um doc rico, para busca. */
export function richDocToText(doc: RichDoc): string {
  const parts: string[] = [];
  const walk = (nodes?: RichNode[]) => {
    for (const n of nodes ?? []) {
      if (n.type === "text") parts.push(n.text);
      else if ("content" in n) walk(n.content);
    }
  };
  walk(doc.content);
  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, 8000);
}
