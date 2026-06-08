"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { comments, votes, articles, notifications, auditLog } from "@/db/schema";
import { requireUser, requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

const CommentSchema = z.object({
  articleId: z.number().int().positive(),
  body: z.string().trim().min(2, "Comentário muito curto.").max(2000),
});

export async function addCommentAction(input: unknown): Promise<Result> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login para comentar." };
  }
  const rl = await checkRateLimit(`comment:${user.id}`, 10, 60_000);
  if (!rl.ok) return { ok: false, error: "Muitos comentários. Aguarde um momento." };

  const parsed = CommentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { articleId, body } = parsed.data;

  const [article] = await db
    .select({ slug: articles.slug, authorId: articles.authorId, title: articles.title, status: articles.status })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1);
  if (!article || article.status !== "published") return { ok: false, error: "Artigo indisponível." };

  await db.insert(comments).values({ articleId, authorId: Number(user.id), body });

  if (article.authorId !== Number(user.id)) {
    await db
      .insert(notifications)
      .values({
        recipientId: article.authorId,
        type: "comment.reply",
        payload: { slug: article.slug, title: article.title },
      })
      .catch(() => {});
  }

  revalidatePath(`/guias/${article.slug}`);
  return { ok: true };
}

export async function hideCommentAction(commentId: number): Promise<Result> {
  let mod;
  try {
    mod = await requireRole("moderator");
  } catch {
    return { ok: false, error: "Apenas moderadores." };
  }

  const [row] = await db
    .select({ id: comments.id, articleId: comments.articleId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!row) return { ok: false, error: "Comentário não encontrado." };

  await db.update(comments).set({ status: "hidden" }).where(eq(comments.id, commentId));
  await db.insert(auditLog).values({
    actorId: Number(mod.id),
    action: "hide_comment",
    target: `comment:${commentId}`,
  });

  const [a] = await db.select({ slug: articles.slug }).from(articles).where(eq(articles.id, row.articleId)).limit(1);
  if (a) revalidatePath(`/guias/${a.slug}`);
  return { ok: true };
}

export async function voteAction(articleId: number): Promise<Result<{ voted: boolean }>> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login para votar." };
  }
  await checkRateLimit(`vote:${user.id}`, 30, 60_000);

  const userId = Number(user.id);
  const [existing] = await db
    .select({ id: votes.id })
    .from(votes)
    .where(and(eq(votes.articleId, articleId), eq(votes.userId, userId)))
    .limit(1);

  let voted: boolean;
  if (existing) {
    await db.delete(votes).where(eq(votes.id, existing.id));
    await db
      .update(articles)
      .set({ votesUp: sql`GREATEST(${articles.votesUp} - 1, 0)` })
      .where(eq(articles.id, articleId));
    voted = false;
  } else {
    await db.insert(votes).values({ userId, articleId, value: 1 }).catch(() => {});
    await db
      .update(articles)
      .set({ votesUp: sql`${articles.votesUp} + 1` })
      .where(eq(articles.id, articleId));
    voted = true;
  }

  const [a] = await db.select({ slug: articles.slug }).from(articles).where(eq(articles.id, articleId)).limit(1);
  if (a) revalidatePath(`/guias/${a.slug}`);
  return { ok: true, data: { voted } };
}
