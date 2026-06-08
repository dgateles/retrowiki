import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, users, votes, articles } from "@/db/schema";

export type CommentItem = {
  id: number;
  body: string;
  authorHandle: string;
  createdAt: Date;
};

export async function listComments(articleId: number): Promise<CommentItem[]> {
  try {
    return await db
      .select({
        id: comments.id,
        body: comments.body,
        authorHandle: users.handle,
        createdAt: comments.createdAt,
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
