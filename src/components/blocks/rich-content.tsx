import { Fragment } from "react";
import { highlightCode } from "@/lib/prism";
import type { RichDoc } from "@/lib/blocks/rich-schema";
import { CalloutBlock, StepsBlock } from "@/components/blocks/static-blocks";
import { GithubReleasesBlock } from "@/components/blocks/github-releases";

// Renderiza o documento do editor rico (TipTap/ProseMirror) com segurança:
// nós e marcas mapeados para elementos via JSX. Estilos inline (cor, tamanho,
// destaque, alinhamento) vêm de valores já validados por allowlist no schema.
// Sem dangerouslySetInnerHTML de conteúdo do usuário, exceto o bloco de código
// (Prism escapa o texto).

/* eslint-disable @typescript-eslint/no-explicit-any */
type Node = any;

function applyMarks(text: string, marks: Node[] | undefined, key: number) {
  let el: React.ReactNode = text;
  for (const m of marks ?? []) {
    switch (m.type) {
      case "bold":
        el = <strong>{el}</strong>;
        break;
      case "italic":
        el = <em>{el}</em>;
        break;
      case "underline":
        el = <u>{el}</u>;
        break;
      case "strike":
        el = <s>{el}</s>;
        break;
      case "code":
        el = <code className="blk-inline-code">{el}</code>;
        break;
      case "subscript":
        el = <sub>{el}</sub>;
        break;
      case "superscript":
        el = <sup>{el}</sup>;
        break;
      case "link":
        el = (
          <a href={m.attrs?.href} rel="nofollow noopener noreferrer" target="_blank" className="blk-a">
            {el}
          </a>
        );
        break;
      case "textStyle": {
        const style: React.CSSProperties = {};
        if (m.attrs?.color) style.color = m.attrs.color;
        if (m.attrs?.fontSize && m.attrs.fontSize !== "100%") style.fontSize = m.attrs.fontSize;
        if (Object.keys(style).length) el = <span style={style}>{el}</span>;
        break;
      }
      case "highlight":
        el = (
          <mark className="blk-mark" style={m.attrs?.color ? { backgroundColor: m.attrs.color } : undefined}>
            {el}
          </mark>
        );
        break;
    }
  }
  return <Fragment key={key}>{el}</Fragment>;
}

function renderInline(nodes: Node[] | undefined) {
  return (nodes ?? []).map((n, i) => {
    if (n.type === "text") return applyMarks(n.text, n.marks, i);
    if (n.type === "hardBreak") return <br key={i} />;
    return null;
  });
}

function textOf(nodes: Node[] | undefined): string {
  return (nodes ?? []).map((n) => (n.type === "text" ? n.text : "")).join("");
}

function alignStyle(node: Node): React.CSSProperties | undefined {
  const a = node.attrs?.textAlign;
  return a && a !== "left" ? { textAlign: a } : undefined;
}

/** Conteúdo de itens de lista e células: parágrafos viram inline. */
function renderFlow(nodes: Node[] | undefined) {
  return (nodes ?? []).map((child: Node, i: number) =>
    child.type === "paragraph" ? <Fragment key={i}>{renderInline(child.content)}</Fragment> : renderBlock(child, i),
  );
}

function renderBlock(node: Node, key: number): React.ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <p key={key} className="blk-p" style={alignStyle(node)}>
          {renderInline(node.content)}
        </p>
      );
    case "heading": {
      const level = Math.min(6, Math.max(1, node.attrs?.level ?? 2));
      const Tag = `h${level}` as "h2";
      return (
        <Tag key={key} className={`blk-h blk-h--${level}`} style={alignStyle(node)}>
          {renderInline(node.content)}
        </Tag>
      );
    }
    case "bulletList":
      return (
        <ul key={key} className="blk-list blk-list--unordered">
          {(node.content ?? []).map((li: Node, i: number) => (
            <li key={i} className="blk-list__item">{renderFlow(li.content)}</li>
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} className="blk-list blk-list--ordered" start={node.attrs?.start ?? 1}>
          {(node.content ?? []).map((li: Node, i: number) => (
            <li key={i} className="blk-list__item">{renderFlow(li.content)}</li>
          ))}
        </ol>
      );
    case "blockquote":
      return (
        <blockquote key={key} className="blk-quote">
          {(node.content ?? []).map((c: Node, i: number) => renderBlock(c, i))}
        </blockquote>
      );
    case "box": {
      const boxTitle = (node.attrs?.title as string) || "";
      const body = (node.content ?? []).map((c: Node, i: number) => renderBlock(c, i));
      if (node.attrs?.collapsed) {
        return (
          <details key={key} className="blk-box">
            <summary className="blk-box__title">{boxTitle || "Detalhes"}</summary>
            <div className="blk-box__body">{body}</div>
          </details>
        );
      }
      return (
        <div key={key} className="blk-box">
          {boxTitle && <p className="blk-box__title">{boxTitle}</p>}
          <div className="blk-box__body">{body}</div>
        </div>
      );
    }
    case "spoiler":
      return (
        <details key={key} className="blk-spoiler">
          <summary className="blk-spoiler__summary">{(node.attrs?.title as string) || "Spoiler"}</summary>
          <div className="blk-spoiler__body">
            {(node.content ?? []).map((c: Node, i: number) => renderBlock(c, i))}
          </div>
        </details>
      );
    case "codeBlock": {
      const { html, lang } = highlightCode(textOf(node.content), node.attrs?.language ?? undefined);
      return (
        <pre key={key} className={`code-block__pre code-block__pre--plain language-${lang}`}>
          <code className="code-block__code" dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      );
    }
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={key} src={node.attrs?.src} alt={node.attrs?.alt ?? ""} className="blk-img" loading="lazy" />
      );
    case "table":
      return (
        <div key={key} className="blk-table-wrap">
          <table className="blk-table">
            <tbody>
              {(node.content ?? []).map((row: Node, i: number) => renderBlock(row, i))}
            </tbody>
          </table>
        </div>
      );
    case "tableRow":
      return (
        <tr key={key} className="blk-table__row">
          {(node.content ?? []).map((cell: Node, i: number) => renderBlock(cell, i))}
        </tr>
      );
    case "tableHeader":
      return (
        <th key={key} className="blk-table__th" colSpan={node.attrs?.colspan ?? 1} rowSpan={node.attrs?.rowspan ?? 1}>
          {renderFlow(node.content)}
        </th>
      );
    case "tableCell":
      return (
        <td key={key} className="blk-table__td" colSpan={node.attrs?.colspan ?? 1} rowSpan={node.attrs?.rowspan ?? 1}>
          {renderFlow(node.content)}
        </td>
      );
    case "horizontalRule":
      return <hr key={key} className="blk-hr" />;
    // Blocos-widget atômicos: reaproveitam os mesmos componentes do render
    // estático para manter paridade visual com o formato antigo.
    case "callout":
      return <CalloutBlock key={key} variant={node.attrs?.variant ?? "info"} text={node.attrs?.text ?? ""} />;
    case "steps":
      return <StepsBlock key={key} items={node.attrs?.items ?? []} />;
    case "githubReleases":
      return <GithubReleasesBlock key={key} owner={node.attrs?.owner} repo={node.attrs?.repo} limit={node.attrs?.limit} />;
    default:
      return null;
  }
}

export function RichContent({ doc }: { doc: RichDoc }) {
  return <>{(doc.content as Node[]).map((n, i) => renderBlock(n, i))}</>;
}
