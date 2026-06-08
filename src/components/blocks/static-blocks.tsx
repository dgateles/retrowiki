import Image from "next/image";
import { Info, CheckCircle2, AlertTriangle, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { highlightCode } from "@/lib/prism";

export function HeadingBlock({ level, text }: { level: 2 | 3 | 4; text: string }) {
  const Tag = `h${level}` as "h2" | "h3" | "h4";
  return <Tag className={cn("blk-h", `blk-h--${level}`)}>{text}</Tag>;
}

export function ParagraphBlock({ text }: { text: string }) {
  // JSX escapa o texto por padrão; sem dangerouslySetInnerHTML.
  return <p className="blk-p">{text}</p>;
}

export function ImageBlock({
  url,
  alt,
  caption,
}: {
  url: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="blk-figure">
      <Image src={url} alt={alt} width={1200} height={675} className="blk-img" />
      {caption && <figcaption className="blk-figcaption">{caption}</figcaption>}
    </figure>
  );
}

export function StepsBlock({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className="blk-steps">
      {items.map((item, i) => (
        <li key={i} className="blk-step">
          <span className="blk-step__num" aria-hidden="true">
            {i + 1}
          </span>
          <div>
            <p className="blk-step__title">{item.title}</p>
            {item.text && <p className="blk-step__text">{item.text}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  // Destaque de sintaxe no servidor. Prism escapa o texto ao tokenizar.
  const { html, lang: resolved } = highlightCode(code, lang);
  const hasCaption = Boolean(lang);
  return (
    <figure className="code-block">
      {hasCaption && <figcaption className="code-block__caption">{lang}</figcaption>}
      <pre
        className={cn(
          "code-block__pre",
          `language-${resolved}`,
          hasCaption ? "code-block__pre--titled" : "code-block__pre--plain",
        )}
      >
        <code className="code-block__code" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </figure>
  );
}

export function ListBlock({ ordered, items }: { ordered: boolean; items: string[] }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={cn("blk-list", ordered ? "blk-list--ordered" : "blk-list--unordered")}>
      {items.map((it, i) => (
        <li key={i} className="blk-list__item">
          {it}
        </li>
      ))}
    </Tag>
  );
}

export function TableBlock({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="blk-table-wrap">
      <table className="blk-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} scope="col" className="blk-table__th">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="blk-table__row">
              {r.map((cell, ci) => (
                <td key={ci} className="blk-table__td">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CALLOUT = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: OctagonAlert,
} as const;

export function CalloutBlock({
  variant,
  text,
}: {
  variant: "info" | "success" | "warning" | "danger";
  text: string;
}) {
  const Icon = CALLOUT[variant];
  return (
    <div className={cn("blk-callout", `blk-callout--${variant}`)} role="note">
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="blk-callout__text">{text}</p>
    </div>
  );
}
