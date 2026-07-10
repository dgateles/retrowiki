import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock, Check, CircleCheck, CircleHelp } from "lucide-react";
import { getTopicBySlug, listPosts, canReadForumPublic, canPostForum, incrementTopicView, isFollowingTopic } from "@/lib/forum";
import { forumHref } from "@/lib/forum-url";
import { getCurrentUser, can } from "@/lib/auth-helpers";
import { ForumPostCard } from "@/components/forum/forum-post-card";
import { ForumReactionBar } from "@/components/forum/forum-reaction-bar";
import { PostActionsMenu } from "@/components/forum/post-actions-menu";
import { BestAnswerButton } from "@/components/forum/best-answer-button";
import { QuoteButton } from "@/components/forum/quote-button";
import { ForumPoll } from "@/components/forum/forum-poll";
import { getTopicPoll } from "@/lib/forum-polls";
import { listEnabledReactions, getForumPostReactionState } from "@/lib/reactions";
import { ReplyForm } from "@/components/forum/reply-form";
import { TopicFollowButton } from "@/components/forum/topic-follow-button";
import { TopicModToolbar } from "@/components/forum/topic-mod-toolbar";
import { listReportTypes } from "@/lib/reports";
import { getReportingSettings } from "@/lib/settings";
import { Pager } from "@/components/ui/pager";
import { postHref } from "@/lib/forum-url";
import { richDocToText } from "@/lib/blocks/rich-schema";
import { forumDocFromBody } from "@/lib/forum";
import type { JSONContent } from "@tiptap/react";
import { pageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { forumTopicSchema, breadcrumbSchema } from "@/lib/seo/builders";

const SEO_BASE = process.env.APP_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ forum: string; topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  const t = await getTopicBySlug(topic);
  if (!t) return {};
  const first = (await listPosts(t.id, 1)).items.find((p) => p.isFirst);
  const excerpt = first ? richDocToText(forumDocFromBody(first.body) as Parameters<typeof richDocToText>[0]).slice(0, 160) : undefined;
  return pageMetadata({ title: t.title, description: excerpt || `Discussão no fórum ${t.forumTitle}.`, path: `/forum/${t.forumSlug}/${t.slug}` });
}

export default async function TopicPage({ params, searchParams }: { params: Promise<{ forum: string; topic: string }>; searchParams: Promise<{ page?: string }> }) {
  const { topic } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const user = await getCurrentUser();
  const t = await getTopicBySlug(topic);
  if (!t || t.status === "hidden" || t.status === "pending") notFound();
  if (!canReadForumPublic({ minReadRole: t.forumMinReadRole, visible: t.forumVisible }, user?.role ?? null)) notFound();

  if (page === 1) await incrementTopicView(t.id);
  const { items, hasMore } = await listPosts(t.id, page);
  const poll = page === 1 ? await getTopicPoll(t.id, user ? Number(user.id) : null) : null;
  const following = await isFollowingTopic(t.id, user ? Number(user.id) : null);
  const canReply = !!user && t.status === "open" && canPostForum({ locked: t.forumLocked, minPostRole: t.forumMinPostRole }, user.role);
  const isMod = can.moderate(user);
  const userId = user ? Number(user.id) : null;
  const isTopicAuthor = userId != null && userId === t.authorId;
  const [reportTypes, reportingSettings, enabledReactions, reactionState] = await Promise.all([
    listReportTypes(),
    getReportingSettings(),
    listEnabledReactions(),
    getForumPostReactionState(items.map((p) => p.id), userId),
  ]);
  const reportTypeOpts = reportTypes.map((r) => ({ id: r.id, title: r.title }));
  const reactionOpts = enabledReactions.map((r) => ({ id: r.id, name: r.name, emoji: r.emoji, weight: r.weight }));

  const firstPost = items.find((p) => p.isFirst) ?? items[0];
  const canonicalPath = `/forum/${t.forumSlug}/${t.slug}`;

  return (
    <main id="main" className="page">
      <JsonLd data={forumTopicSchema({
        base: SEO_BASE, canonicalPath, title: t.title,
        text: firstPost ? richDocToText(forumDocFromBody(firstPost.body) as Parameters<typeof richDocToText>[0]).slice(0, 300) : undefined,
        authorName: firstPost?.authorName ?? "RetroWiki", authorHandle: firstPost?.authorHandle ?? "",
        publishedAt: t.createdAt, replies: t.postsCount, views: t.views,
      })} />
      <JsonLd data={breadcrumbSchema(SEO_BASE, [
        { name: "Fórum", path: "/forum" },
        { name: t.forumTitle, path: forumHref(t.forumSlug) },
        { name: t.title, path: canonicalPath },
      ])} />

      <nav className="forum-crumbs" aria-label="Trilha">
        <Link href="/forum" className="link-inline">Fórum</Link>
        <span aria-hidden="true"> / </span>
        <Link href={forumHref(t.forumSlug)} className="link-inline">{t.forumTitle}</Link>
      </nav>

      <div className="page__head">
        <div className="min-w-0">
          {t.isQuestion && (
            <span className={`ftopic-qbadge ${t.bestPostId ? "ftopic-qbadge--solved" : ""}`}>
              {t.bestPostId ? <><CircleCheck className="size-3.5" aria-hidden="true" /> Resolvido</> : <><CircleHelp className="size-3.5" aria-hidden="true" /> Pergunta</>}
            </span>
          )}
          <h1 className="page__title">
            {(t.status === "locked") && <Lock className="mr-1 inline size-5 text-muted-foreground" aria-label="Trancado" />}
            {t.title}
          </h1>
        </div>
        <div className="ftopic-actions">
          {isMod && <TopicModToolbar topicId={t.id} forumSlug={t.forumSlug} pinned={t.pinned} locked={t.status === "locked"} />}
          {user && <TopicFollowButton topicId={t.id} initialFollowing={following} />}
        </div>
      </div>

      {t.isQuestion && t.bestPostId && (
        <a href={`#post-${t.bestPostId}`} className="ftopic-solved-callout">
          <CircleCheck className="size-5 shrink-0" aria-hidden="true" />
          <span>Esta pergunta foi resolvida. <b>Ver a melhor resposta</b> ↓</span>
        </a>
      )}

      {poll && <ForumPoll poll={poll} canVote={!!user && !poll.closed && !poll.hasVoted} />}

      <div className="fpost-list">
        {items.map((post) => {
          const isAuthor = userId != null && post.authorId === userId;
          const canReport = !!userId && !isAuthor && reportTypeOpts.length > 0;
          const canEdit = isAuthor || isMod;
          const actions = (!!userId || isMod) ? (
            <PostActionsMenu
              postId={post.id}
              permalink={postHref(t.forumSlug, t.slug, post.id)}
              initialDoc={forumDocFromBody(post.body) as JSONContent}
              canReport={canReport}
              reportTypes={reportTypeOpts}
              reportMessageMandatory={reportingSettings.messageMandatory}
              canEdit={canEdit}
              canModerate={isMod}
              isFirst={post.isFirst}
            />
          ) : undefined;
          const st = reactionState.get(post.id);
          const reactions = reactionOpts.length > 0 ? (
            <ForumReactionBar
              postId={post.id}
              reactions={reactionOpts}
              initialCounts={st?.counts ?? {}}
              initialReaction={st?.mine ?? null}
              reactorNames={st?.reactorNames ?? []}
              canReact={!!userId}
            />
          ) : undefined;
          const isBest = t.bestPostId != null && post.id === t.bestPostId;
          const canMarkSolution = t.isQuestion && !post.isFirst && (isTopicAuthor || isMod);
          const solutionControl = (canMarkSolution || isBest) ? (
            canMarkSolution
              ? <BestAnswerButton topicId={t.id} postId={post.id} isSolution={isBest} />
              : <span className="fsolution-tag"><Check className="size-4" aria-hidden="true" /> Solução</span>
          ) : undefined;
          const quoteControl = canReply ? (
            <QuoteButton
              author={post.authorName}
              text={richDocToText(forumDocFromBody(post.body) as Parameters<typeof richDocToText>[0]).slice(0, 4000)}
              permalink={postHref(t.forumSlug, t.slug, post.id)}
            />
          ) : undefined;
          return <ForumPostCard key={post.id} post={post} reactions={reactions} actions={actions} bestAnswer={isBest} solutionControl={solutionControl} quoteControl={quoteControl} />;
        })}
      </div>

      <Pager path={`/forum/${t.forumSlug}/${t.slug}`} page={page} hasMore={hasMore} />

      {canReply ? (
        <div className="mt-8"><ReplyForm topicId={t.id} /></div>
      ) : t.status === "locked" ? (
        <p className="mt-8 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">Este tópico está trancado para novas respostas.</p>
      ) : !user ? (
        <p className="mt-8 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <Link href={`/auth/entrar?next=${encodeURIComponent(`/forum/${t.forumSlug}/${t.slug}`)}`} className="link-inline">Entre</Link> para participar da conversa.
        </p>
      ) : null}
    </main>
  );
}
