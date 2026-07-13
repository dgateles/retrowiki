import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageSquarePlus, Pin, Lock, MessagesSquare, CircleCheck } from "lucide-react";
import { getForumBySlug, listTopics, listSubForums, canReadForumPublic, canPostForum } from "@/lib/forum";
import { topicHref, forumHref } from "@/lib/forum-url";
import { getCurrentUser, can } from "@/lib/auth-helpers";
import { MenuIcon } from "@/components/layout/menu-icon";
import { BulkModProvider, TopicCheckbox } from "@/components/forum/forum-bulk-mod";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/ui/pager";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { pageMetadata } from "@/lib/seo/metadata";
import { count } from "@/lib/plural";
import { PREFIX_CHIP_CLASS } from "@/lib/forum-prefix-style";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const fmt = (d: Date | null) => (d ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(d) : "—");

export async function generateMetadata({ params }: { params: Promise<{ forum: string }> }): Promise<Metadata> {
  const { forum } = await params;
  const f = await getForumBySlug(forum);
  if (!f) return {};
  return pageMetadata({ title: f.title, description: f.description ?? `Tópicos do fórum ${f.title}.`, path: `/forum/${f.slug}` });
}

export default async function ForumPage({ params, searchParams }: { params: Promise<{ forum: string }>; searchParams: Promise<{ page?: string; tag?: string; prefix?: string }> }) {
  const { forum } = await params;
  const { page: pageStr, tag: tagParam, prefix: prefixParam } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const tag = typeof tagParam === "string" && tagParam.trim() ? tagParam.trim().toLowerCase() : undefined;
  const prefix = typeof prefixParam === "string" && prefixParam.trim() ? prefixParam.trim().toLowerCase() : undefined;

  const user = await getCurrentUser();
  const f = await getForumBySlug(forum);
  if (!f || !canReadForumPublic(f, user?.role ?? null)) notFound();

  const { items, hasMore } = await listTopics(f.id, page, tag, prefix);
  const subForums = await listSubForums(f.id, user?.role ?? null);
  const canPost = !!user && canPostForum(f, user.role);
  const isMod = can.moderate(user);

  return (
    <main id="main" className="page">
      <nav className="forum-crumbs" aria-label="Trilha">
        <Link href="/forum" className="link-inline">Fórum</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{f.title}</span>
      </nav>

      <div className="page__head">
        <div>
          <h1 className="page__title">{f.title}</h1>
          {f.description && <p className="page__note">{f.description}</p>}
        </div>
        {canPost && (
          <Button asChild size="sm">
            <Link href={`/forum/${f.slug}/novo`}><MessageSquarePlus className="size-4" aria-hidden="true" /> Novo tópico</Link>
          </Button>
        )}
      </div>

      {subForums.length > 0 && (
        <section className="forum-subs" aria-label="Sub-fóruns">
          <h2 className="forum-subs__title">Sub-fóruns</h2>
          <ul className="forum-list">
            {subForums.map((s) => (
              <li key={s.id} className="forum-row">
                <span className="forum-row__icon" aria-hidden="true">
                  {s.icon ? <MenuIcon name={s.icon} className="size-5" /> : <MessagesSquare className="size-5" />}
                </span>
                <div className="forum-row__main">
                  <Link href={forumHref(s.slug)} className="forum-row__title link-inline">
                    {s.title}
                    {s.locked && <Lock className="ml-1 inline size-3.5 text-muted-foreground" aria-label="Trancado" />}
                  </Link>
                  {s.description && <p className="forum-row__desc">{s.description}</p>}
                  <p className="forum-row__meta">
                    <span className="tabular-nums">{count(s.topicsCount, "tópico", "tópicos")} · {count(s.postsCount, "post", "posts")}</span>
                    {s.lastPosterName && <span className="forum-row__meta-last">· {s.lastPosterName} · {fmt(s.lastPostAt)}</span>}
                  </p>
                </div>
                <div className="forum-row__stats tabular-nums">
                  <span>{count(s.topicsCount, "tópico", "tópicos")}</span>
                  <span>{count(s.postsCount, "post", "posts")}</span>
                </div>
                <div className="forum-row__last">
                  {s.lastPosterName ? (
                    <>
                      <span className="forum-row__last-name">{s.lastPosterName}</span>
                      <span className="forum-row__last-date">{fmt(s.lastPostAt)}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Sem posts</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tag && (
        <div className="ftag-filter">
          <span>Filtrando por <span className="ftag-chip ftag-chip--active">#{tag}</span></span>
          <Link href={forumHref(f.slug)} className="link-inline">Limpar filtro</Link>
        </div>
      )}

      {prefix && items[0]?.prefix && (
        <div className="ftag-filter">
          <span>Filtrando por <span className={cn("rounded px-1.5 py-0.5 text-xs font-semibold", PREFIX_CHIP_CLASS[items[0].prefix.color])}>{items[0].prefix.label}</span></span>
          <Link href={forumHref(f.slug)} className="link-inline">Limpar filtro</Link>
        </div>
      )}

      {items.length === 0 ? (
        <Empty className="mt-6">
          <EmptyHeader>
            <EmptyMedia variant="icon"><MessagesSquare aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>{tag ? "Nenhum tópico com essa tag" : "Nenhum tópico ainda"}</EmptyTitle>
            <EmptyDescription>Seja o primeiro a começar uma conversa aqui.</EmptyDescription>
          </EmptyHeader>
          {canPost && (
            <EmptyContent>
              <Button asChild size="sm"><Link href={`/forum/${f.slug}/novo`}><MessageSquarePlus className="size-4" aria-hidden="true" /> Novo tópico</Link></Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <BulkModProvider forumSlug={f.slug}>
        <ul className="topic-list">
          {items.map((t) => (
            <li key={t.id} className="topic-row">
              {isMod && <TopicCheckbox topicId={t.id} />}
              <span className="topic-row__icon" aria-hidden="true">
                {t.isQuestion && t.bestPostId ? <CircleCheck className="size-4 text-success" /> : t.pinned ? <Pin className="size-4 text-primary" /> : t.status === "locked" ? <Lock className="size-4 text-muted-foreground" /> : t.isQuestion ? <MessagesSquare className="size-4 text-muted-foreground" /> : <MessagesSquare className="size-4 text-muted-foreground" />}
              </span>
              <div className="topic-row__main">
                <Link href={topicHref(f.slug, t.slug)} className="topic-row__title link-inline">
                  {t.prefix && <span className={cn("mr-1.5 rounded px-1.5 py-0.5 text-xs font-semibold align-middle", PREFIX_CHIP_CLASS[t.prefix.color])}>{t.prefix.label}</span>}
                  {t.title}
                  {t.isQuestion && t.bestPostId && <span className="topic-row__solved">Resolvido</span>}
                </Link>
                <p className="topic-row__meta">por {t.authorName} · {count(t.postsCount, "resposta", "respostas")} · {count(t.views, "visualização", "visualizações")}</p>
                {t.tags.length > 0 && (
                  <div className="topic-row__tags">
                    {t.tags.map((tg) => (
                      <Link key={tg.slug} href={`${forumHref(f.slug)}?tag=${encodeURIComponent(tg.slug)}`} className="ftag-chip ftag-chip--link">#{tg.name}</Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="topic-row__last tabular-nums">
                {t.lastPosterName ? (
                  <>
                    <span className="topic-row__last-name">{t.lastPosterName}</span>
                    <span className="topic-row__last-date">{fmt(t.lastPostAt)}</span>
                  </>
                ) : <span className="text-muted-foreground">{fmt(t.createdAt)}</span>}
              </div>
            </li>
          ))}
        </ul>
        </BulkModProvider>
      )}

      <Pager path={`/forum/${f.slug}`} page={page} hasMore={hasMore} />
    </main>
  );
}
