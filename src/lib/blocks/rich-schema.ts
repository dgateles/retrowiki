import { z } from "zod";

// Validação por allowlist do documento do editor rico (formato ProseMirror/TipTap).
// Só os nós e marcas abaixo são aceitos; o resto é rejeitado no servidor.
// Nenhuma URL javascript:, nenhum HTML arbitrário.

const safeHref = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (h) => /^https?:\/\//i.test(h) || h.startsWith("/") || h.startsWith("#") || h.startsWith("mailto:"),
    "URL não permitida",
  );

const LinkMark = z.object({
  type: z.literal("link"),
  attrs: z
    .object({ href: safeHref })
    .transform((a) => ({ href: a.href })),
});

const Mark = z.union([
  z.object({ type: z.literal("bold") }),
  z.object({ type: z.literal("italic") }),
  z.object({ type: z.literal("underline") }),
  z.object({ type: z.literal("strike") }),
  z.object({ type: z.literal("code") }),
  LinkMark,
]);

export type RichMark = z.infer<typeof Mark>;

const TextNode = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(8000),
  marks: z.array(Mark).max(6).optional(),
});

// Nós recursivos via z.lazy (união simples; discriminada não compõe bem com lazy).
type RichNode =
  | z.infer<typeof TextNode>
  | { type: "paragraph"; content?: RichNode[] }
  | { type: "heading"; attrs: { level: number }; content?: RichNode[] }
  | { type: "bulletList"; content?: RichNode[] }
  | { type: "orderedList"; attrs?: { start?: number }; content?: RichNode[] }
  | { type: "listItem"; content?: RichNode[] }
  | { type: "blockquote"; content?: RichNode[] }
  | { type: "codeBlock"; attrs?: { language?: string | null }; content?: RichNode[] }
  | { type: "horizontalRule" }
  | { type: "hardBreak" };

const Node: z.ZodType<RichNode> = z.lazy(() =>
  z.union([
    TextNode,
    z.object({ type: z.literal("paragraph"), content: z.array(Node).max(400).optional() }),
    z.object({
      type: z.literal("heading"),
      attrs: z.object({ level: z.coerce.number().int().min(1).max(6) }),
      content: z.array(Node).max(400).optional(),
    }),
    z.object({ type: z.literal("bulletList"), content: z.array(Node).max(400).optional() }),
    z.object({
      type: z.literal("orderedList"),
      attrs: z.object({ start: z.coerce.number().int().min(1).optional() }).optional(),
      content: z.array(Node).max(400).optional(),
    }),
    z.object({ type: z.literal("listItem"), content: z.array(Node).max(400).optional() }),
    z.object({ type: z.literal("blockquote"), content: z.array(Node).max(400).optional() }),
    z.object({
      type: z.literal("codeBlock"),
      attrs: z.object({ language: z.string().max(20).nullish() }).optional(),
      content: z.array(Node).max(400).optional(),
    }),
    z.object({ type: z.literal("horizontalRule") }),
    z.object({ type: z.literal("hardBreak") }),
  ]),
);

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
