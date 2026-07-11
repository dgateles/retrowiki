import "server-only";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { forums, forumTopics, forumPosts, articles, users } from "@/db/schema";
import { topicHref, postHref } from "@/lib/forum-url";
import { articleHref } from "@/lib/article-url";

export type StreamScope = "tudo" | "forum" | "conteudo" | "seguindo";
export type StreamType = "topic" | "reply" | "guide" | "blog";
export type StreamItem = {
  key: string; type: StreamType; title: string; context: string;
  href: string; authorName: string; authorHandle: string; at: Date;
};

async function recentTopics(limit: number, authorIds?: number[]): Promise<StreamItem[]> {
  try {
    const conds = [eq(forums.visible, true), eq(forums.minReadRole, "member"), inArray(forumTopics.status, ["open", "locked", "archived"] as const), isNull(forumTopics.deletedAt)];
    if (authorIds) conds.push(inArray(forumTopics.authorId, authorIds));
    const rows = await db
      .select({ id: forumTopics.id, title: forumTopics.title, slug: forumTopics.slug, forumTitle: forums.title, forumSlug: forums.slug, at: forumTopics.createdAt, name: users.displayName, handle: users.handle })
      .from(forumTopics)
      .innerJoin(forums, eq(forums.id, forumTopics.forumId))
      .innerJoin(users, eq(users.id, forumTopics.authorId))
      .where(and(...conds))
      .orderBy(desc(forumTopics.createdAt)).limit(limit);
    return rows.map((r) => ({ key: `t${r.id}`, type: "topic", title: r.title, context: `novo tópico em ${r.forumTitle}`, href: topicHref(r.forumSlug, r.slug), authorName: r.name, authorHandle: r.handle, at: r.at }));
  } catch { return []; }
}

async function recentReplies(limit: number, authorIds?: number[]): Promise<StreamItem[]> {
  try {
    const conds = [eq(forumPosts.isFirst, false), eq(forumPosts.status, "visible"), isNull(forumPosts.deletedAt), isNull(forumTopics.deletedAt), inArray(forumTopics.status, ["open", "locked", "archived"] as const), eq(forums.visible, true), eq(forums.minReadRole, "member")];
    if (authorIds) conds.push(inArray(forumPosts.authorId, authorIds));
    const rows = await db
      .select({ postId: forumPosts.id, topicTitle: forumTopics.title, topicSlug: forumTopics.slug, forumSlug: forums.slug, at: forumPosts.createdAt, name: users.displayName, handle: users.handle })
      .from(forumPosts)
      .innerJoin(forumTopics, eq(forumTopics.id, forumPosts.topicId))
      .innerJoin(forums, eq(forums.id, forumTopics.forumId))
      .innerJoin(users, eq(users.id, forumPosts.authorId))
      .where(and(...conds))
      .orderBy(desc(forumPosts.createdAt)).limit(limit);
    return rows.map((r) => ({ key: `p${r.postId}`, type: "reply", title: r.topicTitle, context: "respondeu no fórum", href: postHref(r.forumSlug, r.topicSlug, r.postId), authorName: r.name, authorHandle: r.handle, at: r.at }));
  } catch { return []; }
}

async function recentArticles(limit: number, authorIds?: number[]): Promise<StreamItem[]> {
  try {
    const conds = [eq(articles.status, "published")];
    if (authorIds) conds.push(inArray(articles.authorId, authorIds));
    const rows = await db
      .select({ slug: articles.slug, title: articles.title, kind: articles.kind, at: articles.publishedAt, createdAt: articles.createdAt, name: users.displayName, handle: users.handle })
      .from(articles).innerJoin(users, eq(users.id, articles.authorId))
      .where(and(...conds))
      .orderBy(desc(articles.publishedAt)).limit(limit);
    return rows.map((r) => ({
      key: `a${r.slug}`, type: r.kind === "blog" ? "blog" : "guide",
      title: r.title, context: r.kind === "blog" ? "publicou no blog" : "publicou um guia",
      href: articleHref(r.kind, r.slug), authorName: r.name, authorHandle: r.handle, at: r.at ?? r.createdAt,
    }));
  } catch { return []; }
}

/**
 * Feed unificado de novidades do site, ordenado por data.
 * No escopo "seguindo", `followedIds` limita aos autores que o usuário segue.
 */
export async function getActivityStream(scope: StreamScope, limit = 40, followedIds?: number[]): Promise<StreamItem[]> {
  if (scope === "seguindo") {
    if (!followedIds || followedIds.length === 0) return [];
    const [topics, replies, arts] = await Promise.all([
      recentTopics(limit, followedIds),
      recentReplies(limit, followedIds),
      recentArticles(limit, followedIds),
    ]);
    return [...topics, ...replies, ...arts].filter((i) => !!i.at).sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
  }
  const wantForum = scope === "tudo" || scope === "forum";
  const wantContent = scope === "tudo" || scope === "conteudo";
  const [topics, replies, arts] = await Promise.all([
    wantForum ? recentTopics(limit) : Promise.resolve<StreamItem[]>([]),
    wantForum ? recentReplies(limit) : Promise.resolve<StreamItem[]>([]),
    wantContent ? recentArticles(limit) : Promise.resolve<StreamItem[]>([]),
  ]);
  return [...topics, ...replies, ...arts]
    .filter((i) => !!i.at)
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);
}
