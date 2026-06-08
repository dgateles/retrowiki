import { z } from "zod";

/**
 * Allowlist de blocos. Conteúdo do usuário é uma árvore destes tipos. Um bloco
 * de tipo desconhecido é rejeitado na submissão e nunca renderizado.
 * (Ver docs-plataforma/05.)
 */

const Heading = z.object({
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  text: z.string().min(1).max(160),
});

const Paragraph = z.object({
  type: z.literal("paragraph"),
  text: z.string().min(1).max(4000),
});

const ImageBlock = z.object({
  type: z.literal("image"),
  url: z.string().url(),
  alt: z.string().min(1).max(300), // obrigatório (a11y, SC 1.1.1)
  caption: z.string().max(300).optional(),
});

const Steps = z.object({
  type: z.literal("steps"),
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(160),
        text: z.string().max(2000),
      }),
    )
    .min(1)
    .max(30),
});

const Callout = z.object({
  type: z.literal("callout"),
  variant: z.enum(["info", "success", "warning", "danger"]),
  text: z.string().min(1).max(2000),
});

const ListBlock = z.object({
  type: z.literal("list"),
  ordered: z.boolean().default(false),
  items: z.array(z.string().min(1).max(600)).min(1).max(60),
});

const TableBlock = z.object({
  type: z.literal("table"),
  headers: z.array(z.string().max(120)).min(1).max(8),
  rows: z.array(z.array(z.string().max(400)).max(8)).min(1).max(120),
});

// Blocos dinâmicos: guardam referência/IDs, nunca dados ao vivo nem URL livre.
const GithubReleases = z.object({
  type: z.literal("github-releases"),
  owner: z.string().regex(/^[A-Za-z0-9-]{1,39}$/),
  repo: z.string().regex(/^[A-Za-z0-9._-]{1,100}$/),
  limit: z.number().int().min(1).max(5).default(3),
});

const StoreLinks = z.object({
  type: z.literal("store-links"),
  storeIds: z.array(z.number().int().positive()).min(1).max(12),
});

const DeviceSpecBlock = z.object({
  type: z.literal("device-spec"),
  deviceId: z.number().int().positive(),
});

export const Block = z.discriminatedUnion("type", [
  Heading,
  Paragraph,
  ImageBlock,
  Steps,
  Callout,
  ListBlock,
  TableBlock,
  GithubReleases,
  StoreLinks,
  DeviceSpecBlock,
]);
export type Block = z.infer<typeof Block>;

export const BlockTreeSchema = z.object({
  version: z.literal(1),
  blocks: z.array(Block).min(1).max(200),
});
export type BlockTree = z.infer<typeof BlockTreeSchema>;

/** Extrai texto plano de uma árvore (para busca e <meta>). */
export function blockTreeToText(tree: BlockTree): string {
  const parts: string[] = [];
  for (const b of tree.blocks) {
    if (b.type === "heading" || b.type === "paragraph") parts.push(b.text);
    else if (b.type === "callout") parts.push(b.text);
    else if (b.type === "steps") b.items.forEach((i) => parts.push(i.title, i.text));
    else if (b.type === "list") parts.push(...b.items);
    else if (b.type === "table") { parts.push(...b.headers); b.rows.forEach((r) => parts.push(...r)); }
    else if (b.type === "image" && b.caption) parts.push(b.caption);
  }
  return parts.join(" ").slice(0, 8000);
}
