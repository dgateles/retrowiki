import "server-only";
import { and, desc, eq, like, or, count } from "drizzle-orm";
import { db } from "@/db";
import { articles, users, revisions, reviews, comments, articleFollows, votes } from "@/db/schema";

/** Exclui um artigo e os registros dependentes (revisões, reviews, comentários,
 * follows, reações). Ação destrutiva — só admin. */
export async function deleteArticleCompletely(articleId: number): Promise<boolean> {
  try {
    await db.update(articles).set({ currentRevisionId: null }).where(eq(articles.id, articleId));
    const revs = await db.select({ id: revisions.id }).from(revisions).where(eq(revisions.articleId, articleId));
    for (const r of revs) await db.delete(reviews).where(eq(reviews.revisionId, r.id));
    await db.delete(revisions).where(eq(revisions.articleId, articleId));
    await db.delete(comments).where(eq(comments.articleId, articleId));
    await db.delete(articleFollows).where(eq(articleFollows.articleId, articleId));
    await db.delete(votes).where(eq(votes.articleId, articleId));
    await db.delete(articles).where(eq(articles.id, articleId));
    return true;
  } catch {
    return false;
  }
}

export const ADMIN_ARTICLES_PAGE_SIZE = 20;

export const ARTICLE_STATUSES = ["draft", "pending", "changes_requested", "published", "rejected", "archived"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  pending: "Em revisão",
  changes_requested: "Ajustes pedidos",
  published: "Publicado",
  rejected: "Rejeitado",
  archived: "Arquivado",
};

export type AdminArticleRow = {
  id: number;
  slug: string;
  title: string;
  status: string;
  authorName: string;
  authorHandle: string;
  createdAt: Date;
  publishedAt: Date | null;
};

export async function listAllArticlesForAdmin({ page = 1, q, status }: { page?: number; q?: string; status?: string }): Promise<{ items: AdminArticleRow[]; hasMore: boolean }> {
  const offset = (Math.max(1, page) - 1) * ADMIN_ARTICLES_PAGE_SIZE;
  const term = q && q.trim().length >= 2 ? `%${q.trim().replace(/[%_]/g, "\\$&")}%` : null;
  const statusFilter = (ARTICLE_STATUSES as readonly string[]).includes(status ?? "") ? (status as ArticleStatus) : null;
  const conds = [
    term ? or(like(articles.title, term), like(articles.slug, term)) : undefined,
    statusFilter ? eq(articles.status, statusFilter) : undefined,
  ].filter(Boolean);
  try {
    const rows = await db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        status: articles.status,
        createdAt: articles.createdAt,
        publishedAt: articles.publishedAt,
        authorName: users.displayName,
        authorHandle: users.handle,
      })
      .from(articles)
      .leftJoin(users, eq(users.id, articles.authorId))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(articles.createdAt))
      .limit(ADMIN_ARTICLES_PAGE_SIZE + 1)
      .offset(offset);
    return {
      items: rows.slice(0, ADMIN_ARTICLES_PAGE_SIZE).map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        status: r.status,
        authorName: r.authorName ?? "—",
        authorHandle: r.authorHandle ?? "",
        createdAt: r.createdAt,
        publishedAt: r.publishedAt,
      })),
      hasMore: rows.length > ADMIN_ARTICLES_PAGE_SIZE,
    };
  } catch {
    return { items: [], hasMore: false };
  }
}

/** Contagem por status (para os contadores das abas). */
export async function articleStatusCounts(): Promise<Record<string, number>> {
  try {
    const rows = await db.select({ status: articles.status, n: count() }).from(articles).groupBy(articles.status);
    const out: Record<string, number> = {};
    for (const r of rows) out[r.status] = Number(r.n);
    return out;
  } catch {
    return {};
  }
}
