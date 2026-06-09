import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, revisions, reviews, users, devices, comments } from "@/db/schema";
import type { BlockTree } from "@/lib/blocks/schema";

const TYPE_LABEL: Record<string, string> = {
  tutorial: "Tutorial",
  buying_guide: "Guia de compras",
  troubleshooting: "Solução de problemas",
  firmware: "Firmware",
  general: "Geral",
};
export function typeLabel(t: string) {
  return TYPE_LABEL[t] ?? t;
}

export const ARTICLES_PAGE_SIZE = 20;

type ArticleListItem = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  type: string;
  publishedAt: Date | null;
  authorHandle: string;
  viewsCount: number;
  commentCount: number;
};

export async function listPublishedArticles(
  opts: { page?: number; deviceSlug?: string; type?: string } = {},
): Promise<{ items: ArticleListItem[]; hasMore: boolean }> {
  const page = Math.max(1, opts.page ?? 1);
  const offset = (page - 1) * ARTICLES_PAGE_SIZE;
  try {
    const where = [eq(articles.status, "published")];
    if (opts.type) where.push(eq(articles.type, opts.type as "tutorial"));
    if (opts.deviceSlug) where.push(eq(devices.slug, opts.deviceSlug));

    const rows = await db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        summary: articles.summary,
        type: articles.type,
        publishedAt: articles.publishedAt,
        authorHandle: users.handle,
        viewsCount: articles.viewsCount,
        commentCount: sql<number>`(select count(*) from ${comments} where ${comments.articleId} = ${articles.id} and ${comments.status} = 'visible')`,
      })
      .from(articles)
      .innerJoin(users, eq(users.id, articles.authorId))
      .leftJoin(devices, eq(devices.id, articles.deviceId))
      .where(and(...where))
      .orderBy(desc(articles.publishedAt))
      .limit(ARTICLES_PAGE_SIZE + 1)
      .offset(offset);

    return { items: rows.slice(0, ARTICLES_PAGE_SIZE), hasMore: rows.length > ARTICLES_PAGE_SIZE };
  } catch {
    return { items: [], hasMore: false };
  }
}

export type PublishedArticle = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  type: string;
  publishedAt: Date | null;
  authorHandle: string;
  authorName: string;
  authorRole: "member" | "contributor" | "moderator" | "admin";
  authorReputation: number;
  deviceSlug: string | null;
  body: BlockTree;
};

export async function getPublishedArticle(slug: string): Promise<PublishedArticle | null> {
  try {
    const [a] = await db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        summary: articles.summary,
        type: articles.type,
        publishedAt: articles.publishedAt,
        currentRevisionId: articles.currentRevisionId,
        authorHandle: users.handle,
        authorName: users.displayName,
        authorRole: users.role,
        authorReputation: users.reputation,
        deviceSlug: devices.slug,
      })
      .from(articles)
      .innerJoin(users, eq(users.id, articles.authorId))
      .leftJoin(devices, eq(devices.id, articles.deviceId))
      .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
      .limit(1);
    if (!a || !a.currentRevisionId) return null;

    const [rev] = await db
      .select({ body: revisions.body })
      .from(revisions)
      .where(eq(revisions.id, a.currentRevisionId))
      .limit(1);
    if (!rev) return null;

    return { ...a, body: rev.body as BlockTree };
  } catch {
    return null;
  }
}

export const QUEUE_PAGE_SIZE = 20;

export async function getModerationQueue(page = 1) {
  const offset = (Math.max(1, page) - 1) * QUEUE_PAGE_SIZE;
  try {
    const rows = await db
      .select({
        articleId: articles.id,
        title: articles.title,
        type: articles.type,
        status: articles.status,
        authorHandle: users.handle,
        reviewId: reviews.id,
        revisionId: reviews.revisionId,
        submittedAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(revisions, eq(revisions.id, reviews.revisionId))
      .innerJoin(articles, eq(articles.id, revisions.articleId))
      .innerJoin(users, eq(users.id, articles.authorId))
      .where(eq(reviews.decision, "pending"))
      .orderBy(desc(reviews.createdAt))
      .limit(QUEUE_PAGE_SIZE + 1)
      .offset(offset);
    return { items: rows.slice(0, QUEUE_PAGE_SIZE), hasMore: rows.length > QUEUE_PAGE_SIZE };
  } catch {
    return { items: [], hasMore: false };
  }
}

export async function getRevisionBody(revisionId: number): Promise<BlockTree | null> {
  try {
    const [rev] = await db
      .select({ body: revisions.body })
      .from(revisions)
      .where(eq(revisions.id, revisionId))
      .limit(1);
    return (rev?.body as BlockTree) ?? null;
  } catch {
    return null;
  }
}

export async function listArticlesByDevice(deviceId: number) {
  try {
    return await db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        type: articles.type,
      })
      .from(articles)
      .where(and(eq(articles.deviceId, deviceId), eq(articles.status, "published")))
      .orderBy(articles.type, articles.title)
      .limit(40);
  } catch {
    return [];
  }
}

export async function getArticleForEdit(id: number) {
  try {
    const [a] = await db
      .select({
        id: articles.id,
        title: articles.title,
        type: articles.type,
        deviceId: articles.deviceId,
        authorId: articles.authorId,
        status: articles.status,
        currentRevisionId: articles.currentRevisionId,
      })
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);
    if (!a || !a.currentRevisionId) return null;
    const [rev] = await db
      .select({ body: revisions.body })
      .from(revisions)
      .where(eq(revisions.id, a.currentRevisionId))
      .limit(1);
    return rev ? { ...a, body: rev.body as BlockTree } : null;
  } catch {
    return null;
  }
}

export async function getUserDrafts(userId: number) {
  try {
    return await db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        type: articles.type,
        status: articles.status,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .where(eq(articles.authorId, userId))
      .orderBy(desc(articles.updatedAt))
      .limit(50);
  } catch {
    return [];
  }
}
