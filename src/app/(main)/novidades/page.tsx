import Link from "next/link";
import type { Metadata } from "next";
import { MessagesSquare, Reply, BookOpen, PenLine } from "lucide-react";
import { getActivityStream, type StreamScope, type StreamType } from "@/lib/activity-stream";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getFollowedUserIds } from "@/lib/follows";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Novidades", description: "O que está acontecendo na comunidade RetroWiki." };

const BASE_SCOPES: { key: StreamScope; label: string }[] = [
  { key: "tudo", label: "Tudo" },
  { key: "forum", label: "Fórum" },
  { key: "conteudo", label: "Guias & Blog" },
];
const ICON: Record<StreamType, typeof MessagesSquare> = { topic: MessagesSquare, reply: Reply, guide: BookOpen, blog: PenLine };
const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);

export default async function NovidadesPage({ searchParams }: { searchParams: Promise<{ escopo?: string }> }) {
  const { escopo } = await searchParams;
  const user = await getCurrentUser();
  const valid: StreamScope[] = user ? ["tudo", "forum", "conteudo", "seguindo"] : ["tudo", "forum", "conteudo"];
  const scope: StreamScope = (valid as string[]).includes(escopo ?? "") ? (escopo as StreamScope) : "tudo";
  const SCOPES = user ? [...BASE_SCOPES, { key: "seguindo" as StreamScope, label: "Seguindo" }] : BASE_SCOPES;
  const followedIds = scope === "seguindo" && user ? await getFollowedUserIds(Number(user.id)) : undefined;
  const items = await getActivityStream(scope, 40, followedIds);

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
        <p className="empty mt-8">{scope === "seguindo" ? "Você ainda não segue ninguém — ou quem você segue ainda não postou. Visite perfis e toque em Seguir." : "Nada por aqui ainda. Volte em breve."}</p>
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
