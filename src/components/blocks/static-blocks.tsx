import Image from "next/image";
import { Info, CheckCircle2, AlertTriangle, OctagonAlert } from "lucide-react";

export function HeadingBlock({ level, text }: { level: 2 | 3 | 4; text: string }) {
  const Tag = (`h${level}` as "h2" | "h3" | "h4");
  const size = level === 2 ? "text-2xl" : level === 3 ? "text-xl" : "text-lg";
  return <Tag className={`mt-8 mb-3 font-semibold ${size}`}>{text}</Tag>;
}

export function ParagraphBlock({ text }: { text: string }) {
  // JSX escapa o texto por padrão; sem dangerouslySetInnerHTML.
  return <p className="my-4 leading-relaxed text-foreground/90">{text}</p>;
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
    <figure className="my-6">
      <Image
        src={url}
        alt={alt}
        width={1200}
        height={675}
        className="h-auto w-full rounded-lg border border-border object-cover"
      />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function StepsBlock({
  items,
}: {
  items: { title: string; text: string }[];
}) {
  return (
    <ol className="my-6 space-y-4">
      {items.map((item, i) => (
        <li key={i} className="flex gap-4">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <div>
            <p className="font-semibold">{item.title}</p>
            {item.text && <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ListBlock({ ordered, items }: { ordered: boolean; items: string[] }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`my-4 space-y-1.5 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}>
      {items.map((it, i) => (
        <li key={i} className="text-foreground/90">{it}</li>
      ))}
    </Tag>
  );
}

export function TableBlock({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                scope="col"
                className="border-b border-border bg-muted/50 px-3 py-2 text-left font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-border/60">
              {r.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CALLOUT = {
  info: { Icon: Info, cls: "border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-300" },
  success: { Icon: CheckCircle2, cls: "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300" },
  warning: { Icon: AlertTriangle, cls: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300" },
  danger: { Icon: OctagonAlert, cls: "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300" },
} as const;

export function CalloutBlock({
  variant,
  text,
}: {
  variant: "info" | "success" | "warning" | "danger";
  text: string;
}) {
  const { Icon, cls } = CALLOUT[variant];
  return (
    <div className={`my-5 flex gap-3 rounded-lg border p-4 text-sm ${cls}`} role="note">
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="text-foreground/90">{text}</p>
    </div>
  );
}
