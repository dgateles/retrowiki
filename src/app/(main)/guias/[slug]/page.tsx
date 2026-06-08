import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPublishedArticle, typeLabel } from "@/lib/articles";
import { listComments, getVoteState } from "@/lib/comments";
import { ArticleBody } from "@/lib/blocks/render";
import { Button } from "@/components/ui/button";
import { VoteButton } from "@/components/engagement/vote-button";
import { CommentForm } from "@/components/engagement/comment-form";
import { auth } from "@/auth";

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
  const [comments, vote] = await Promise.all([
    listComments(a.id),
    getVoteState(a.id, userId),
  ]);

  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/guias">
          <ChevronLeft className="size-4" aria-hidden="true" /> Guias
        </Link>
      </Button>

      <article>
        <header className="mb-6">
          <span className="text-xs font-medium text-primary">{typeLabel(a.type)}</span>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">{a.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            por @{a.authorHandle}
            {a.deviceSlug && (
              <>
                {" · "}
                <Link href={`/consoles/${a.deviceSlug}`} className="hover:text-foreground underline">
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

        <div className="text-[15px]">
          <ArticleBody body={a.body} />
        </div>
      </article>

      <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">
        <VoteButton articleId={a.id} initialCount={vote.count} initialVoted={vote.voted} />
        <span className="text-sm text-muted-foreground">
          {comments.length} {comments.length === 1 ? "comentário" : "comentários"}
        </span>
      </div>

      <section aria-labelledby="comentarios" className="mt-8">
        <h2 id="comentarios" className="text-lg font-semibold">Comentários</h2>

        {comments.length > 0 && (
          <ul className="mt-4 space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">@{c.authorHandle}</span>
                  <time className="text-xs text-muted-foreground" dateTime={new Date(c.createdAt).toISOString()}>
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(c.createdAt))}
                  </time>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/90">{c.body}</p>
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
