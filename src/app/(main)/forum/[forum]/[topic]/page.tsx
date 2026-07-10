import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { getTopicBySlug, listPosts, canReadForumPublic, canPostForum, incrementTopicView, isFollowingTopic } from "@/lib/forum";
import { forumHref } from "@/lib/forum-url";
import { getCurrentUser, can } from "@/lib/auth-helpers";
import { ForumPostCard } from "@/components/forum/forum-post-card";
import { ReplyForm } from "@/components/forum/reply-form";
import { TopicFollowButton } from "@/components/forum/topic-follow-button";
import { TopicModToolbar } from "@/components/forum/topic-mod-toolbar";
import { PostModActions } from "@/components/forum/post-mod-actions";
import { ReportButton } from "@/components/moderation/report-button";
import { listReportTypes } from "@/lib/reports";
import { getReportingSettings } from "@/lib/settings";
import { Pager } from "@/components/ui/pager";
import { richDocToText } from "@/lib/blocks/rich-schema";
import { forumDocFromBody } from "@/lib/forum";
import { pageMetadata } from "@/lib/seo/metadata";

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
  const following = await isFollowingTopic(t.id, user ? Number(user.id) : null);
  const canReply = !!user && t.status === "open" && canPostForum({ locked: t.forumLocked, minPostRole: t.forumMinPostRole }, user.role);
  const isMod = can.moderate(user);
  const userId = user ? Number(user.id) : null;
  const [reportTypes, reportingSettings] = await Promise.all([listReportTypes(), getReportingSettings()]);
  const reportTypeOpts = reportTypes.map((r) => ({ id: r.id, title: r.title }));

  return (
    <main id="main" className="page">
      <nav className="forum-crumbs" aria-label="Trilha">
        <Link href="/forum" className="link-inline">Fórum</Link>
        <span aria-hidden="true"> / </span>
        <Link href={forumHref(t.forumSlug)} className="link-inline">{t.forumTitle}</Link>
      </nav>

      <div className="page__head">
        <h1 className="page__title">
          {(t.status === "locked") && <Lock className="mr-1 inline size-5 text-muted-foreground" aria-label="Trancado" />}
          {t.title}
        </h1>
        {user && <TopicFollowButton topicId={t.id} initialFollowing={following} />}
      </div>

      {isMod && <TopicModToolbar topicId={t.id} forumSlug={t.forumSlug} pinned={t.pinned} locked={t.status === "locked"} />}

      <div className="fpost-list">
        {items.map((post) => {
          const canReport = userId && post.authorId !== userId && reportTypeOpts.length > 0;
          const canModPost = isMod && !post.isFirst;
          const footer = (canReport || canModPost) ? (
            <>
              {canReport && <ReportButton targetType="forum_post" targetId={post.id} reportTypes={reportTypeOpts} messageMandatory={reportingSettings.messageMandatory} variant="icon" />}
              {canModPost && <PostModActions postId={post.id} />}
            </>
          ) : undefined;
          return <ForumPostCard key={post.id} post={post} footer={footer} />;
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
