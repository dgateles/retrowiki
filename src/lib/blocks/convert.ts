import type { BlockTree, Block } from "./schema";
import type { RichDoc, RichNode } from "./rich-schema";

// Conversor do formato antigo (árvore de blocos) para o documento do editor rico
// (ProseMirror/TipTap). Todo texto dos blocos é texto puro, então cada campo vira
// um nó "text". Os blocos-widget (callout, steps, github-releases) viram nós
// atômicos equivalentes. Blocos sem correspondência (0 uso real) são descartados.

/** Conteúdo de um nó de texto: omite o nó quando vazio (text exige min. 1 char). */
function textContent(s: string): RichNode[] | undefined {
  return s ? [{ type: "text", text: s }] : undefined;
}

function cell(kind: "tableHeader" | "tableCell", text: string): RichNode {
  return {
    type: kind,
    attrs: { colspan: 1, rowspan: 1 },
    content: [{ type: "paragraph", content: textContent(text) }],
  };
}

function blockToNodes(b: Block): RichNode[] {
  switch (b.type) {
    case "heading":
      return [{ type: "heading", attrs: { level: b.level }, content: textContent(b.text) }];
    case "paragraph":
      return [{ type: "paragraph", content: textContent(b.text) }];
    case "image":
      return [{ type: "image", attrs: { src: b.url, alt: b.alt } }];
    case "code":
      return [{ type: "codeBlock", attrs: { language: b.lang ?? null }, content: textContent(b.code) }];
    case "list":
      return [
        {
          type: b.ordered ? "orderedList" : "bulletList",
          content: b.items.map((it) => ({
            type: "listItem",
            content: [{ type: "paragraph", content: textContent(it) }],
          })),
        },
      ];
    case "table":
      return [
        {
          type: "table",
          content: [
            { type: "tableRow", content: b.headers.map((h) => cell("tableHeader", h)) },
            ...b.rows.map((r) => ({
              type: "tableRow" as const,
              content: r.map((c) => cell("tableCell", c)),
            })),
          ],
        },
      ];
    case "callout":
      return [{ type: "callout", attrs: { variant: b.variant, text: b.text } }];
    case "steps":
      return [{ type: "steps", attrs: { items: b.items } }];
    case "github-releases":
      return [{ type: "githubReleases", attrs: { owner: b.owner, repo: b.repo, limit: b.limit } }];
    // Sem correspondência no editor rico (0 uso real): descartados.
    case "store-links":
    case "device-spec":
      return [];
    default:
      return [];
  }
}

/** Converte uma árvore de blocos validada em um documento do editor rico. */
export function blockTreeToRichDoc(tree: BlockTree): RichDoc {
  const content = tree.blocks.flatMap(blockToNodes);
  // doc.content exige ao menos 1 nó.
  if (content.length === 0) content.push({ type: "paragraph" });
  return { type: "doc", content } as RichDoc;
}
