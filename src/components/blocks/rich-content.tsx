import { Fragment } from "react";
import { highlightCode } from "@/lib/prism";
import type { RichDoc } from "@/lib/blocks/rich-schema";

// Renderiza o documento do editor rico (TipTap/ProseMirror) com segurança:
// nós e marcas mapeados para elementos via JSX. Sem dangerouslySetInnerHTML de
// conteúdo do usuário, exceto o bloco de código (Prism escapa o texto).

/* eslint-disable @typescript-eslint/no-explicit-any */
type Node = any;

function applyMarks(text: string, marks: { type: string; attrs?: { href?: string } }[] | undefined, key: number) {
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
      case "link":
        el = (
          <a href={m.attrs?.href} rel="nofollow noopener noreferrer" target="_blank" className="blk-a">
            {el}
          </a>
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

function renderListItem(li: Node, key: number) {
  const children = (li.content ?? []).map((child: Node, i: number) => {
    if (child.type === "paragraph") return <Fragment key={i}>{renderInline(child.content)}</Fragment>;
    return renderBlock(child, i);
  });
  return (
    <li key={key} className="blk-list__item">
      {children}
    </li>
  );
}

function renderBlock(node: Node, key: number): React.ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <p key={key} className="blk-p">
          {renderInline(node.content)}
        </p>
      );
    case "heading": {
      const level = Math.min(6, Math.max(1, node.attrs?.level ?? 2));
      const Tag = `h${level}` as "h2";
      return (
        <Tag key={key} className={`blk-h blk-h--${level <= 4 ? level : 4}`}>
          {renderInline(node.content)}
        </Tag>
      );
    }
    case "bulletList":
      return (
        <ul key={key} className="blk-list blk-list--unordered">
          {(node.content ?? []).map((li: Node, i: number) => renderListItem(li, i))}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} className="blk-list blk-list--ordered" start={node.attrs?.start ?? 1}>
          {(node.content ?? []).map((li: Node, i: number) => renderListItem(li, i))}
        </ol>
      );
    case "blockquote":
      return (
        <blockquote key={key} className="blk-quote">
          {(node.content ?? []).map((c: Node, i: number) => renderBlock(c, i))}
        </blockquote>
      );
    case "codeBlock": {
      const code = textOf(node.content);
      const { html, lang } = highlightCode(code, node.attrs?.language ?? undefined);
      return (
        <pre key={key} className={`code-block__pre code-block__pre--plain language-${lang}`}>
          <code className="code-block__code" dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      );
    }
    case "horizontalRule":
      return <hr key={key} className="blk-hr" />;
    default:
      return null;
  }
}

export function RichContent({ doc }: { doc: RichDoc }) {
  return <>{(doc.content as Node[]).map((n, i) => renderBlock(n, i))}</>;
}
