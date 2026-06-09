import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPublishedArticle, typeLabel } from "@/lib/articles";
import { recordView } from "@/lib/article-views";
import { listComments, getVoteState, isFollowing, commentDocFromBody } from "@/lib/comments";
import { rankForReputation, roleLabel } from "@/lib/ranks";
import { ArticleBody } from "@/lib/blocks/render";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { VoteButton } from "@/components/engagement/vote-button";
import { SharePopover } from "@/components/engagement/share-popover";
import { CommentForm } from "@/components/engagement/comment-form";
import { CommentBody } from "@/components/engagement/comment-body";
import { CommentActions } from "@/components/engagement/comment-actions";
import { CommentAvatar } from "@/components/engagement/comment-avatar";
import { CommentReplyButton } from "@/components/engagement/comment-reply-button";
import { CommentHighlighter } from "@/components/engagement/comment-highlighter";
import { FollowButton } from "@/components/engagement/follow-button";
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

function relTime(d: Date) {
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `há ${days} d`;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
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
  await recordView(a.id, userId);
  const [comments, vote, following] = await Promise.all([
    listComments(a.id),
    getVoteState(a.id, userId),
    isFollowing(a.id, userId),
  ]);
  const rank = rankForReputation(a.authorReputation);

  return (
    <main id="main" className="page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: a.title,
          inLanguage: "pt-BR",
          author: { "@type": "Person", name: a.authorName },
          ...(a.summary ? { description: a.summary } : {}),
          ...(a.publishedAt ? { datePublished: new Date(a.publishedAt).toISOString() } : {}),
        }}
      />

      <nav aria-label="Trilha" className="crumbs">
        <Link href="/" className="crumbs__link">Início</Link>
        <span className="crumbs__sep" aria-hidden="true">/</span>
        <Link href="/guias" className="crumbs__link">Guias</Link>
        <span className="crumbs__sep" aria-hidden="true">/</span>
        <span className="crumbs__current">{a.title}</span>
      </nav>

      <div className="thread-head">
        <div>
          <span className="article__kind">{typeLabel(a.type)}</span>
          <h1 className="thread-head__title">{a.title}</h1>
        </div>
        <div className="thread-head__actions">
          <SharePopover title={a.title} />
        </div>
      </div>

      <article className="post">
        <header className="post__header">
          <div className="post__author">
            <Link href={`/u/${a.authorHandle}`} className="post__avatar" aria-hidden="true">
              {initials(a.authorName)}
            </Link>
            <div>
              <Link href={`/u/${a.authorHandle}`} className="post__author-name">{a.authorName}</Link>
              <p className="post__author-sub">
                {rank.label} · {rank.index}/{rank.total}
                {a.publishedAt && (
                  <>
                    {" · "}
                    <time dateTime={new Date(a.publishedAt).toISOString()}>
                      {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(a.publishedAt))}
                    </time>
                  </>
                )}
              </p>
            </div>
          </div>
          {(a.authorRole === "moderator" || a.authorRole === "admin") && (
            <span className="post__badge">{roleLabel(a.authorRole)}</span>
          )}
        </header>

        <div className="post__body">
          <ArticleBody body={a.body} />
        </div>

        <footer className="post__footer">
          <VoteButton articleId={a.id} initialCount={vote.count} initialVoted={vote.voted} />
          <span className="post__reactors">
            {vote.count > 0
              ? `${vote.count} ${vote.count === 1 ? "pessoa achou" : "pessoas acharam"} útil`
              : "Seja o primeiro a achar útil"}
            {a.deviceSlug && (
              <>
                {" · "}
                <Link href={`/consoles/${a.deviceSlug}`} className="article__meta-link">{a.deviceSlug}</Link>
              </>
            )}
          </span>
        </footer>
      </article>

      <Button asChild variant="ghost" size="sm" className="mt-5">
        <Link href="/guias">
          <ChevronLeft className="size-4" aria-hidden="true" /> Voltar aos guias
        </Link>
      </Button>

      <section aria-labelledby="comentarios" className="comments">
        <CommentHighlighter />
        <div className="comments__head">
          <h2 id="comentarios" className="comments__title">
            Comentários ({comments.length})
          </h2>
          {userId && <FollowButton articleId={a.id} initialFollowing={following} />}
        </div>

        {comments.length > 0 && (
          <ul className="comments__list">
            {comments.map((c) => {
              const owner = userId === c.authorId;
              const when = relTime(new Date(c.createdAt));
              return (
                <li key={c.id} id={`comentario-${c.id}`} className="comment">
                  <CommentAvatar name={c.authorName} src={c.authorAvatar} />
                  <div className="comment__main">
                    <div className="comment__head">
                      <Link href={`/u/${c.authorHandle}`} className="comment__author">
                        {c.authorName}
                      </Link>
                      <time className="comment__date" dateTime={new Date(c.createdAt).toISOString()}>
                        {when}
                        {c.editedAt && <span className="comment__edited"> (editado)</span>}
                      </time>
                    </div>
                    <CommentBody body={c.body} />
                    <div className="comment__foot">
                      {userId && (
                        <CommentReplyButton
                          quotedDoc={commentDocFromBody(c.body) as never}
                          authorName={c.authorName}
                          authorId={c.authorId}
                          when={when}
                        />
                      )}
                      {(owner || isMod) && (
                        <CommentActions
                          commentId={c.id}
                          initialDoc={commentDocFromBody(c.body) as never}
                          canEdit={owner}
                          canDelete={owner || isMod}
                        />
                      )}
                      {isMod && <HideCommentButton commentId={c.id} />}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6">
          {userId ? (
            <CommentForm articleId={a.id} meName={session?.user?.name ?? "Você"} meAvatar={session?.user?.image ?? null} />
          ) : (
            <p className="muted">
              <Link href="/auth/entrar" className="underline">Entre</Link> para comentar e votar.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
