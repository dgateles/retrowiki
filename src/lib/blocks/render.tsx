import { BlockTreeSchema, type Block } from "./schema";
import {
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  StepsBlock,
  CalloutBlock,
  ListBlock,
  TableBlock,
} from "@/components/blocks/static-blocks";
import { GithubReleasesBlock } from "@/components/blocks/github-releases";
import { StoreLinksBlock } from "@/components/blocks/store-links";
import { DeviceSpecBlock } from "@/components/blocks/device-spec-block";

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case "heading":
      return <HeadingBlock key={key} level={block.level} text={block.text} />;
    case "paragraph":
      return <ParagraphBlock key={key} text={block.text} />;
    case "image":
      return <ImageBlock key={key} url={block.url} alt={block.alt} caption={block.caption} />;
    case "steps":
      return <StepsBlock key={key} items={block.items} />;
    case "callout":
      return <CalloutBlock key={key} variant={block.variant} text={block.text} />;
    case "list":
      return <ListBlock key={key} ordered={block.ordered} items={block.items} />;
    case "table":
      return <TableBlock key={key} headers={block.headers} rows={block.rows} />;
    case "github-releases":
      return <GithubReleasesBlock key={key} owner={block.owner} repo={block.repo} limit={block.limit} />;
    case "store-links":
      return <StoreLinksBlock key={key} storeIds={block.storeIds} />;
    case "device-spec":
      return <DeviceSpecBlock key={key} deviceId={block.deviceId} />;
    default:
      return null; // tipo desconhecido nunca renderiza
  }
}

/** Renderiza a árvore de blocos de um artigo. Valida de forma defensiva também
 * na leitura (conteúdo migrado/antigo). */
export function ArticleBody({ body }: { body: unknown }) {
  const parsed = BlockTreeSchema.safeParse(body);
  if (!parsed.success) return null;
  return <>{parsed.data.blocks.map((b, i) => renderBlock(b, i))}</>;
}
