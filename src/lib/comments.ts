import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, users, votes, articles, articleFollows } from "@/db/schema";
import { isRichDoc } from "@/lib/blocks/rich-schema";

/** Converte o corpo salvo (JSON rico ou texto antigo) num doc para o editor. */
export function commentDocFromBody(body: string): unknown {
  try {
    const p = JSON.parse(body);
    if (isRichDoc(p)) return p;
  } catch {
    // texto puro antigo: envolve num parágrafo
  }
  return {
    type: "doc",
    content: [{ type: "paragraph", content: body.trim() ? [{ type: "text", text: body }] : [] }],
  };
}

export type CommentItem = {
  id: number;
  body: string;
  authorId: number;
  authorHandle: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: Date;
  editedAt: Date | null;
};

export async function listComments(articleId: number): Promise<CommentItem[]> {
  try {
    return await db
      .select({
        id: comments.id,
        body: comments.body,
        authorId: comments.authorId,
        authorHandle: users.handle,
        authorName: users.displayName,
        authorAvatar: users.avatarUrl,
        createdAt: comments.createdAt,
        editedAt: comments.editedAt,
      })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.authorId))
      .where(and(eq(comments.articleId, articleId), eq(comments.status, "visible")))
      .orderBy(asc(comments.createdAt))
      .limit(200);
  } catch {
    return [];
  }
}

export async function isFollowing(articleId: number, userId: number | null): Promise<boolean> {
  if (!userId) return false;
  try {
    const [row] = await db
      .select({ id: articleFollows.id })
      .from(articleFollows)
      .where(and(eq(articleFollows.articleId, articleId), eq(articleFollows.userId, userId)))
      .limit(1);
    return !!row;
  } catch {
    return false;
  }
}

export async function getVoteState(
  articleId: number,
  userId: number | null,
): Promise<{ count: number; voted: boolean }> {
  try {
    const [a] = await db
      .select({ count: articles.votesUp })
      .from(articles)
      .where(eq(articles.id, articleId))
      .limit(1);
    let voted = false;
    if (userId) {
      const [v] = await db
        .select({ id: votes.id })
        .from(votes)
        .where(and(eq(votes.articleId, articleId), eq(votes.userId, userId)))
        .limit(1);
      voted = !!v;
    }
    return { count: a?.count ?? 0, voted };
  } catch {
    return { count: 0, voted: false };
  }
}
