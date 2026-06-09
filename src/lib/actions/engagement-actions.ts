"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { comments, votes, articles, notifications, auditLog, articleFollows, users } from "@/db/schema";
import { requireUser, requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { evaluateBadges } from "@/lib/badges";
import { isRichDoc, RichDocSchema, richDocToText } from "@/lib/blocks/rich-schema";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

// Valida e serializa o corpo rico de um comentário (mesma allowlist dos guias).
// O corpo chega como string JSON (o doc do editor é serializado no cliente para
// passar limpo pela fronteira do Server Action).
function validateCommentBody(raw: unknown): { ok: true; json: string; text: string } | { ok: false; error: string } {
  if (typeof raw !== "string" || raw.length > 200_000) return { ok: false, error: "Comentário inválido." };
  let doc: unknown;
  try {
    doc = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Comentário inválido." };
  }
  if (!isRichDoc(doc)) return { ok: false, error: "Comentário inválido." };
  const parsed = RichDocSchema.safeParse(doc);
  if (!parsed.success) return { ok: false, error: "Comentário inválido." };
  const text = richDocToText(parsed.data);
  if (text.trim().length < 2) return { ok: false, error: "Comentário muito curto." };
  if (text.length > 5000) return { ok: false, error: "Comentário muito longo." };
  return { ok: true, json: JSON.stringify(parsed.data), text };
}

const AddSchema = z.object({
  articleId: z.number().int().positive(),
  body: z.string(),
  follow: z.boolean().optional(),
  replyToUserId: z.number().int().positive().optional(),
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

  const parsed = AddSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };
  const valid = validateCommentBody(parsed.data.body);
  if (!valid.ok) return { ok: false, error: valid.error };

  const { articleId } = parsed.data;
  const userId = Number(user.id);

  const [article] = await db
    .select({ slug: articles.slug, authorId: articles.authorId, title: articles.title, status: articles.status })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1);
  if (!article || article.status !== "published") return { ok: false, error: "Artigo indisponível." };

  const [ins] = await db.insert(comments).values({ articleId, authorId: userId, body: valid.json });
  const commentId = (ins as unknown as { insertId: number }).insertId;
  await evaluateBadges(userId);

  // Seguir o tópico ao comentar (se marcado), para receber novas respostas.
  if (parsed.data.follow !== false) {
    await db.insert(articleFollows).values({ userId, articleId }).catch(() => {});
  }

  // Dados de quem comentou, para a notificação mostrar avatar e nome, e o link
  // levar direto ao comentário.
  const [me] = await db
    .select({ name: users.displayName, avatar: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const payload = {
    slug: article.slug,
    title: article.title,
    commentId,
    actorName: me?.name ?? "Alguém",
    actorAvatar: me?.avatar ?? null,
  };
  const quoted = parsed.data.replyToUserId;

  // Notificar o usuário citado na resposta (se houver e não for ele mesmo).
  if (quoted && quoted !== userId) {
    await db.insert(notifications).values({ recipientId: quoted, type: "comment.quote", payload }).catch(() => {});
  }

  // Notificar o autor do artigo e quem segue o tópico, menos quem comentou e
  // menos o citado (que já recebeu a notificação específica).
  const followers = await db
    .select({ userId: articleFollows.userId })
    .from(articleFollows)
    .where(and(eq(articleFollows.articleId, articleId), ne(articleFollows.userId, userId)));
  const recipients = new Set<number>(followers.map((f) => f.userId));
  if (article.authorId !== userId) recipients.add(article.authorId);
  if (quoted) recipients.delete(quoted);
  for (const rid of recipients) {
    await db.insert(notifications).values({ recipientId: rid, type: "comment.reply", payload }).catch(() => {});
  }

  revalidatePath(`/guias/${article.slug}`);
  return { ok: true };
}

export async function editCommentAction(commentId: number, body: unknown): Promise<Result> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }

  const [row] = await db
    .select({ id: comments.id, authorId: comments.authorId, articleId: comments.articleId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!row) return { ok: false, error: "Comentário não encontrado." };
  if (row.authorId !== Number(user.id)) return { ok: false, error: "Você só pode editar seus comentários." };

  const valid = validateCommentBody(body);
  if (!valid.ok) return { ok: false, error: valid.error };

  await db.update(comments).set({ body: valid.json, editedAt: new Date() }).where(eq(comments.id, commentId));

  const [a] = await db.select({ slug: articles.slug }).from(articles).where(eq(articles.id, row.articleId)).limit(1);
  if (a) revalidatePath(`/guias/${a.slug}`);
  return { ok: true };
}

export async function deleteCommentAction(commentId: number): Promise<Result> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }

  const [row] = await db
    .select({ id: comments.id, authorId: comments.authorId, articleId: comments.articleId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!row) return { ok: false, error: "Comentário não encontrado." };

  const userId = Number(user.id);
  let isMod = false;
  if (row.authorId !== userId) {
    try {
      await requireRole("moderator");
      isMod = true;
    } catch {
      return { ok: false, error: "Sem permissão." };
    }
  }

  await db.delete(comments).where(eq(comments.id, commentId));
  if (isMod) {
    await db.insert(auditLog).values({ actorId: userId, action: "delete_comment", target: `comment:${commentId}` });
  }

  const [a] = await db.select({ slug: articles.slug }).from(articles).where(eq(articles.id, row.articleId)).limit(1);
  if (a) revalidatePath(`/guias/${a.slug}`);
  return { ok: true };
}

export async function toggleFollowAction(articleId: number): Promise<Result<{ following: boolean }>> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login para seguir." };
  }
  const userId = Number(user.id);

  const [existing] = await db
    .select({ id: articleFollows.id })
    .from(articleFollows)
    .where(and(eq(articleFollows.articleId, articleId), eq(articleFollows.userId, userId)))
    .limit(1);

  let following: boolean;
  if (existing) {
    await db.delete(articleFollows).where(eq(articleFollows.id, existing.id));
    following = false;
  } else {
    await db.insert(articleFollows).values({ userId, articleId }).catch(() => {});
    following = true;
  }
  return { ok: true, data: { following } };
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
