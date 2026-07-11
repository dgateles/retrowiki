import Link from "next/link";
import type { Metadata } from "next";
import { MessagesSquare, Lock } from "lucide-react";
import { getForumIndex } from "@/lib/forum";
import { forumHref } from "@/lib/forum-url";
import { getCurrentUser } from "@/lib/auth-helpers";
import { MenuIcon } from "@/components/layout/menu-icon";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { pageMetadata } from "@/lib/seo/metadata";
import { count } from "@/lib/plural";

export const metadata: Metadata = pageMetadata({
  title: "Fórum",
  description: "Discussões da comunidade RetroWiki: apresentações, ajuda com emulação, firmware e hardware.",
  path: "/forum",
});
export const dynamic = "force-dynamic";

const fmt = (d: Date | null) => (d ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(d) : "—");

export default async function ForumIndexPage() {
  const user = await getCurrentUser();
  const categories = await getForumIndex(user?.role ?? null);

  return (
    <main id="main" className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Fórum</h1>
          <p className="page__note">Converse com a comunidade: apresentações, ajuda e discussões.</p>
        </div>
      </div>

      {categories.length === 0 ? (
        <Empty className="mt-6">
          <EmptyHeader>
            <EmptyMedia variant="icon"><MessagesSquare aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>Fórum em construção</EmptyTitle>
            <EmptyDescription>Ainda não há fóruns por aqui. Volte em breve.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="forum-cats">
          {categories.map((cat) => (
            <section key={cat.id} className="forum-cat" aria-label={cat.title}>
              <h2 className="forum-cat__title">{cat.title}</h2>
              {cat.description && <p className="forum-cat__desc">{cat.description}</p>}
              <ul className="forum-list">
                {cat.forums.map((f) => (
                  <li key={f.id} className="forum-row">
                    <span className="forum-row__icon" aria-hidden="true">
                      {f.icon ? <MenuIcon name={f.icon} className="size-5" /> : <MessagesSquare className="size-5" />}
                    </span>
                    <div className="forum-row__main">
                      <Link href={forumHref(f.slug)} className="forum-row__title link-inline">
                        {f.title}
                        {f.locked && <Lock className="ml-1 inline size-3.5 text-muted-foreground" aria-label="Trancado" />}
                      </Link>
                      {f.description && <p className="forum-row__desc">{f.description}</p>}
                      {f.subForums && f.subForums.length > 0 && (
                        <ul className="forum-row__subs" aria-label={`Sub-fóruns de ${f.title}`}>
                          {f.subForums.map((s) => (
                            <li key={s.id}>
                              <Link href={forumHref(s.slug)} className="forum-row__sub link-inline">
                                {s.title}
                                {s.locked && <Lock className="ml-1 inline size-3 text-muted-foreground" aria-label="Trancado" />}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="forum-row__stats tabular-nums">
                      <span>{count(f.topicsCount, "tópico", "tópicos")}</span>
                      <span>{count(f.postsCount, "post", "posts")}</span>
                    </div>
                    <div className="forum-row__last">
                      {f.lastPosterName ? (
                        <>
                          <span className="forum-row__last-name">{f.lastPosterName}</span>
                          <span className="forum-row__last-date">{fmt(f.lastPostAt)}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Sem posts</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
