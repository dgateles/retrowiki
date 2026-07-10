import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { getTopicBySlug, listPosts, canReadForumPublic, incrementTopicView } from "@/lib/forum";
import { forumHref } from "@/lib/forum-url";
import { getCurrentUser } from "@/lib/auth-helpers";
import { ForumPostCard } from "@/components/forum/forum-post-card";
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
      </div>

      <div className="fpost-list">
        {items.map((post) => (
          <ForumPostCard key={post.id} post={post} />
        ))}
      </div>

      <Pager path={`/forum/${t.forumSlug}/${t.slug}`} page={page} hasMore={hasMore} />
    </main>
  );
}
