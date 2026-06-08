import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, revisions, reviews, users, devices } from "@/db/schema";
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

export async function listPublishedArticles() {
  try {
    return await db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        summary: articles.summary,
        type: articles.type,
        publishedAt: articles.publishedAt,
        authorHandle: users.handle,
      })
      .from(articles)
      .innerJoin(users, eq(users.id, articles.authorId))
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.publishedAt))
      .limit(60);
  } catch {
    return [];
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

export async function getModerationQueue() {
  try {
    return await db
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
      .limit(100);
  } catch {
    return [];
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

export async function getUserDrafts(userId: number) {
  try {
    return await db
      .select({
        id: articles.id,
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
