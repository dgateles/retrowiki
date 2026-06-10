import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper, Eye } from "lucide-react";
import { listPublishedArticles } from "@/lib/articles";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/ui/pager";
import { auth } from "@/auth";
import { can } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Blog",
  description: "Novidades, bastidores e artigos da equipe e da comunidade RetroWiki.",
};
export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(d));
}

function plural(n: number, s: string, p: string) {
  return `${n} ${n === 1 ? s : p}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, hasMore } = await listPublishedArticles({ page, kind: "blog" });
  const session = await auth();
  const canWrite = can.moderate(session?.user ?? null);

  return (
    <main id="main" className="page">
      <div className="page__head">
        <h1 className="page__title">Blog</h1>
        {canWrite && (
          <Button asChild size="sm">
            <Link href="/estudio/novo?kind=blog">Escrever post</Link>
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty mt-8">
          <Newspaper className="empty__icon" aria-hidden="true" />
          <p className="empty__text">Ainda não há posts no blog.</p>
        </div>
      ) : (
        <>
          <ul className="blog-grid">
            {items.map((a) => (
              <li key={a.id}>
                <Link href={`/blog/${a.slug}`} className="blog-card">
                  <span className="blog-card__cover">
                    {a.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.coverImage} alt="" className="blog-card__img" loading="lazy" />
                    ) : (
                      <span className="blog-card__cover-fallback" aria-hidden="true"><Newspaper className="size-8" /></span>
                    )}
                  </span>
                  <h2 className="blog-card__title">{a.title}</h2>
                  {a.summary && <p className="blog-card__summary">{a.summary}</p>}
                  <div className="blog-card__foot">
                    <span className="blog-card__author">
                      <span className="blog-card__avatar" aria-hidden="true">
                        {a.authorAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.authorAvatar} alt="" className="blog-card__avatar-img" />
                        ) : (
                          initials(a.authorName)
                        )}
                      </span>
                      <span className="blog-card__author-name">{a.authorName}</span>
                      {a.publishedAt && <span className="blog-card__date">· {fmtDate(a.publishedAt)}</span>}
                    </span>
                    <span className="blog-card__views">
                      <Eye className="size-3.5" aria-hidden="true" /> {plural(Number(a.viewsCount), "view", "views")}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pager path="/blog" page={page} hasMore={hasMore} params={{}} />
        </>
      )}
    </main>
  );
}
