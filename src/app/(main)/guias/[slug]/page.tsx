import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPublishedArticle, typeLabel } from "@/lib/articles";
import { listComments, getVoteState } from "@/lib/comments";
import { ArticleBody } from "@/lib/blocks/render";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { VoteButton } from "@/components/engagement/vote-button";
import { CommentForm } from "@/components/engagement/comment-form";
import { HideCommentButton } from "@/components/engagement/hide-comment-button";
import { auth } from "@/auth";
import { can } from "@/lib/auth-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getPublishedArticle(slug);
  if (!a) return {};
  return { title: a.title, description: a.summary ?? undefined };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = await getPublishedArticle(slug);
  if (!a) notFound();

  const session = await auth();
  const userId = session?.user ? Number(session.user.id) : null;
  const isMod = can.moderate(session?.user ?? null);
  const [comments, vote] = await Promise.all([
    listComments(a.id),
    getVoteState(a.id, userId),
  ]);

  return (
    <main id="main" className="page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: a.title,
          inLanguage: "pt-BR",
          author: { "@type": "Person", name: `@${a.authorHandle}` },
          ...(a.summary ? { description: a.summary } : {}),
          ...(a.publishedAt ? { datePublished: new Date(a.publishedAt).toISOString() } : {}),
        }}
      />
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/guias">
          <ChevronLeft className="size-4" aria-hidden="true" /> Guias
        </Link>
      </Button>

      <article>
        <header className="article__header">
          <span className="article__kind">{typeLabel(a.type)}</span>
          <h1 className="article__title">{a.title}</h1>
          <p className="article__meta">
            por{" "}
            <Link href={`/u/${a.authorHandle}`} className="article__meta-link">
              @{a.authorHandle}
            </Link>
            {a.deviceSlug && (
              <>
                {" · "}
                <Link href={`/consoles/${a.deviceSlug}`} className="article__meta-link">
                  {a.deviceSlug}
                </Link>
              </>
            )}
            {a.publishedAt && (
              <>
                {" · "}
                <time dateTime={new Date(a.publishedAt).toISOString()}>
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(a.publishedAt))}
                </time>
              </>
            )}
          </p>
        </header>

        <div className="article__body">
          <ArticleBody body={a.body} />
        </div>
      </article>

      <div className="engage">
        <VoteButton articleId={a.id} initialCount={vote.count} initialVoted={vote.voted} />
        <span className="text-sm text-muted-foreground">
          {comments.length} {comments.length === 1 ? "comentário" : "comentários"}
        </span>
      </div>

      <section aria-labelledby="comentarios" className="comments">
        <h2 id="comentarios" className="comments__title">Comentários</h2>

        {comments.length > 0 && (
          <ul className="comments__list">
            {comments.map((c) => (
              <li key={c.id} className="comment">
                <div className="comment__head">
                  <Link href={`/u/${c.authorHandle}`} className="comment__author">
                    @{c.authorHandle}
                  </Link>
                  <time className="comment__date" dateTime={new Date(c.createdAt).toISOString()}>
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(c.createdAt))}
                  </time>
                </div>
                <p className="comment__body">{c.body}</p>
                {isMod && (
                  <div className="mt-2">
                    <HideCommentButton commentId={c.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6">
          {userId ? (
            <CommentForm articleId={a.id} />
          ) : (
            <p className="text-sm text-muted-foreground">
              <Link href="/auth/entrar" className="underline">Entre</Link> para comentar e votar.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
