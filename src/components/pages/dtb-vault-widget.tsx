"use client";

import { useEffect, useState } from "react";
import { FileCode2, Download, Cpu, ExternalLink, ArrowRight } from "lucide-react";
import { WidgetTitle, type TitleLevel, type TitleColor, type TitleAlign } from "@/components/pages/widget-title";

type DtbFile = {
  filename: string;
  console: string;
  boardRevision: string;
  uploadedAt: string;
  totalDownloads: number;
  url: string;
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

/** Widget dinâmico: últimos arquivos .dtb enviados ao DTB Vault. Busca no cliente
 *  (via /api/dtb-files, que cacheia 60s) — igual na página publicada e na prévia. */
export function DtbVaultWidget({
  title, titleLevel = "h2", titleColor = "default", titleFx = "none", titleAlign = "left", count = 5,
}: {
  title: string;
  titleLevel?: TitleLevel;
  titleColor?: TitleColor;
  titleFx?: string;
  titleAlign?: TitleAlign;
  count?: number;
}) {
  const [files, setFiles] = useState<DtbFile[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/dtb-files?count=${count}`)
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((d: { files: DtbFile[] }) => { if (alive) setFiles(d.files ?? []); })
      .catch(() => { if (alive) setFiles([]); });
    return () => { alive = false; };
  }, [count]);

  return (
    <section aria-label={title || "DTB Vault"} className="w-full">
      <div className="page__head">
        <WidgetTitle text={title} level={titleLevel} color={titleColor} fx={titleFx} align={titleAlign} className="flex-1" />
        <a href="https://dtbvault.com" target="_blank" rel="noopener noreferrer" className="section-link">
          DTB Vault <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </div>

      {files === null ? (
        <ul className="dtb-grid" aria-hidden="true">
          {Array.from({ length: count }).map((_, i) => (
            <li key={i} className="dtb-card dtb-card--skeleton">
              <div className="dtb-skel dtb-skel--name" />
              <div className="dtb-skel dtb-skel--meta" />
              <div className="dtb-skel dtb-skel--foot" />
            </li>
          ))}
        </ul>
      ) : files.length === 0 ? (
        <p className="muted text-sm">Nenhum arquivo disponível no momento.</p>
      ) : (
        <ul className="dtb-grid">
          {files.map((f) => (
            <li key={f.url}>
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="dtb-card">
                <span className="dtb-card__head">
                  <FileCode2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="dtb-card__name" title={f.filename}>{f.filename}</span>
                  <ExternalLink className="dtb-card__ext size-3.5 shrink-0" aria-hidden="true" />
                </span>
                <span className="dtb-card__meta">
                  {f.console && <span className="dtb-badge">{f.console}</span>}
                  {f.boardRevision && <span className="dtb-card__rev"><Cpu className="size-3 shrink-0" aria-hidden="true" /> {f.boardRevision}</span>}
                </span>
                <span className="dtb-card__foot">
                  {f.uploadedAt && <time dateTime={f.uploadedAt}>{fmtDate(f.uploadedAt)}</time>}
                  <span className="dtb-card__dl"><Download className="size-3 shrink-0" aria-hidden="true" /> {f.totalDownloads}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
