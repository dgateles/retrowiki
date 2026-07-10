import Link from "next/link";
import type { Metadata } from "next";
import { MessagesSquare, Reply, BookOpen, PenLine } from "lucide-react";
import { getActivityStream, type StreamScope, type StreamType } from "@/lib/activity-stream";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Novidades", description: "O que está acontecendo na comunidade RetroWiki." };

const SCOPES: { key: StreamScope; label: string }[] = [
  { key: "tudo", label: "Tudo" },
  { key: "forum", label: "Fórum" },
  { key: "conteudo", label: "Guias & Blog" },
];
const ICON: Record<StreamType, typeof MessagesSquare> = { topic: MessagesSquare, reply: Reply, guide: BookOpen, blog: PenLine };
const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);

export default async function NovidadesPage({ searchParams }: { searchParams: Promise<{ escopo?: string }> }) {
  const { escopo } = await searchParams;
  const scope: StreamScope = escopo === "forum" || escopo === "conteudo" ? escopo : "tudo";
  const items = await getActivityStream(scope);

  return (
    <main id="main" className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Novidades</h1>
          <p className="page__note">O que está acontecendo na comunidade.</p>
        </div>
      </div>

      <nav aria-label="Filtro" className="scope-tabs">
        {SCOPES.map((s) => (
          <Link
            key={s.key}
            href={`/novidades?escopo=${s.key}`}
            aria-current={scope === s.key ? "page" : undefined}
            className={cn("scope-tabs__link", scope === s.key && "scope-tabs__link--active")}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="empty mt-8">Nada por aqui ainda. Volte em breve.</p>
      ) : (
        <ul className="stream mt-6">
          {items.map((it) => {
            const Icon = ICON[it.type];
            return (
              <li key={it.key} className="stream__item">
                <span className="stream__icon" aria-hidden="true"><Icon className="size-4" /></span>
                <div className="stream__main">
                  <p className="stream__line">
                    <Link href={`/u/${it.authorHandle}`} className="stream__author">{it.authorName}</Link>{" "}
                    <span className="stream__ctx">{it.context}</span>
                  </p>
                  <Link href={it.href} className="stream__title link-inline">{it.title}</Link>
                </div>
                <time className="stream__time tabular-nums" dateTime={it.at.toISOString()}>{fmt(it.at)}</time>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
