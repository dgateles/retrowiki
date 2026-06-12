import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { typeLabel, type PublishedArticle } from "@/lib/articles";
import { recordView } from "@/lib/article-views";
import { listComments, isFollowing, commentDocFromBody } from "@/lib/comments";
import { roleLabel } from "@/lib/ranks";
import { getRankForReputation } from "@/lib/admin/ranks-db";
import { ArticleBody } from "@/lib/blocks/render";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReactionBar } from "@/components/engagement/reaction-bar";
import { listEnabledReactions, getReactionCounts, getUserReaction, getRecentReactors } from "@/lib/reactions";
import { getReputationSettings, getReportingSettings, getAssignmentSettings, getStaffSettings } from "@/lib/settings";
import { listReportTypes } from "@/lib/reports";
import { ReportButton } from "@/components/moderation/report-button";
import { getAssigneeOptions, assignmentsForContent } from "@/lib/assignments";
import { AssignButton } from "@/components/moderation/assign-button";
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

/** Rendização compartilhada de um artigo (guia ou post de blog). O `kind` muda só
 * a trilha, o cabeçalho e os rótulos de navegação. */
export async function ArticleView({ a }: { a: PublishedArticle }) {
  const isBlog = a.kind === "blog";
  const section = isBlog ? { label: "Blog", href: "/blog", back: "Voltar ao blog", edit: "Editar post", propose: "Sugerir edição" } : { label: "Guias", href: "/guias", back: "Voltar aos guias", edit: "Editar guia", propose: "Sugerir edição" };

  const session = await auth();
  const userId = session?.user ? Number(session.user.id) : null;
  const isMod = can.moderate(session?.user ?? null);
  await recordView(a.id, userId);

  const [comments, following, repSettings, enabledReactions, reportingSettings, reportTypes, staffSettings] = await Promise.all([
    listComments(a.id),
    isFollowing(a.id, userId),
    getReputationSettings(),
    listEnabledReactions(),
    getReportingSettings(),
    listReportTypes(),
    getStaffSettings(),
  ]);
  const reportTypeOpts = reportTypes.map((t) => ({ id: t.id, title: t.title }));

  const assignSettings = isMod ? await getAssignmentSettings() : { enabled: false, autoCloseDays: 0 };
  const assigneeOptions = isMod && assignSettings.enabled ? await getAssigneeOptions() : { users: [], teams: [] };
  const openAssignments = isMod && assignSettings.enabled ? await assignmentsForContent(a.id) : [];
  const fallbackReactionId = enabledReactions[0]?.id ?? null;
  const [reactionCountsMap, myReaction, reactors] = await Promise.all([
    getReactionCounts(a.id, fallbackReactionId),
    userId ? getUserReaction(userId, a.id, fallbackReactionId) : Promise.resolve(null),
    getRecentReactors(a.id, 3),
  ]);
  const reactionCounts: Record<number, number> = Object.fromEntries(reactionCountsMap);
  const rank = await getRankForReputation(a.authorReputation);
  const publishedFmt = a.publishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(a.publishedAt)) : null;

  return (
    <main id="main" className="page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": isBlog ? "BlogPosting" : "TechArticle",
          headline: a.title,
          inLanguage: "pt-BR",
          author: { "@type": "Person", name: a.authorName },
          ...(a.summary ? { description: a.summary } : {}),
          ...(a.coverImage ? { image: a.coverImage } : {}),
          ...(a.publishedAt ? { datePublished: new Date(a.publishedAt).toISOString() } : {}),
        }}
      />

      <nav aria-label="Trilha" className="crumbs">
        <Link href="/" className="crumbs__link">Início</Link>
        <span className="crumbs__sep" aria-hidden="true">/</span>
        <Link href={section.href} className="crumbs__link">{section.label}</Link>
        <span className="crumbs__sep" aria-hidden="true">/</span>
        <span className="crumbs__current">{a.title}</span>
      </nav>

      {isBlog ? (
        <header className="blog-head">
          {a.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.coverImage} alt="" className="blog-head__cover" />
          )}
          <div className="blog-head__bar">
            <h1 className="blog-head__title">{a.title}</h1>
            <SharePopover title={a.title} />
          </div>
          <div className="blog-head__byline">
            <Link href={`/u/${a.authorHandle}`} className="post__avatar" aria-hidden="true" tabIndex={-1}>
              {a.authorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.authorAvatar} alt="" className="post__avatar-img" />
              ) : (
                initials(a.authorName)
              )}
            </Link>
            <span>
              Por <Link href={`/u/${a.authorHandle}`} className="blog-head__author">{a.authorName}</Link>
              {publishedFmt && <> · {publishedFmt}</>}
            </span>
          </div>
        </header>
      ) : (
        <div className="thread-head">
          <div>
            <Badge variant="secondary" className="font-mono text-[10px] tracking-wider uppercase">{typeLabel(a.type)}</Badge>
            <h1 className="thread-head__title mt-2">{a.title}</h1>
          </div>
          <div className="thread-head__actions">
            <SharePopover title={a.title} />
          </div>
        </div>
      )}

      <article className={isBlog ? "post post--flush" : "post"}>
        {!isBlog && (
          <header className="post__header">
            <div className="post__author">
              <Link href={`/u/${a.authorHandle}`} className="post__avatar" aria-hidden="true" tabIndex={-1}>
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
            {staffSettings.showBadge && (a.authorRole === "moderator" || a.authorRole === "admin") && (
              <span className="post__badge">{roleLabel(a.authorRole)}</span>
            )}
          </header>
        )}

        <div className="post__body">
          <ArticleBody body={a.body} />
        </div>

        <footer className="post__footer">
          {userId && userId !== a.authorId && reportTypeOpts.length > 0 && (
            <ReportButton targetType="article" targetId={a.id} reportTypes={reportTypeOpts} messageMandatory={reportingSettings.messageMandatory} />
          )}
          {userId === a.authorId ? (
            <Link href={`/estudio/${a.id}`} className="report-trigger"><Pencil className="size-4" aria-hidden="true" /><span>{section.edit}</span></Link>
          ) : userId ? (
            <Link href={`/estudio/${a.id}`} className="report-trigger"><Pencil className="size-4" aria-hidden="true" /><span>{section.propose}</span></Link>
          ) : null}
          {isMod && assignSettings.enabled && (
            <AssignButton articleId={a.id} mods={assigneeOptions.users} teams={assigneeOptions.teams} />
          )}
          {openAssignments.length > 0 && (
            <span className="post__reactors">Atribuído a {openAssignments.map((x) => x.assigneeName).join(", ")}</span>
          )}
          {a.deviceSlug && !isBlog && (
            <Link href={`/consoles/${a.deviceSlug}`} className="article__meta-link">{a.deviceSlug}</Link>
          )}
          {repSettings.enabled && enabledReactions.length > 0 && (
            <ReactionBar
              articleId={a.id}
              reactions={enabledReactions.map((r) => ({ id: r.id, name: r.name, emoji: r.emoji, weight: r.weight }))}
              initialCounts={reactionCounts}
              initialReaction={myReaction}
              reactorNames={reactors.names}
              initialTotal={reactors.total}
            />
          )}
        </footer>
      </article>

      <Button asChild variant="ghost" size="sm" className="mt-5">
        <Link href={section.href}>
          <ChevronLeft className="size-4" aria-hidden="true" /> {section.back}
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
                      {userId && !owner && reportTypeOpts.length > 0 && (
                        <ReportButton targetType="comment" targetId={c.id} reportTypes={reportTypeOpts} messageMandatory={reportingSettings.messageMandatory} variant="icon" />
                      )}
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
