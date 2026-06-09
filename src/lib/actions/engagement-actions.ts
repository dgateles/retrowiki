"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql, count, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { comments, votes, articles, auditLog, articleFollows, users } from "@/db/schema";
import { requireUser, requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { evaluateBadges } from "@/lib/badges";
import { runTrigger } from "@/lib/achievements";
import { canEditOwn, canDeleteOwn, maxReactionsPerDay } from "@/lib/permissions";
import { getReaction } from "@/lib/reactions";
import { getReputationSettings } from "@/lib/settings";
import { createNotification } from "@/lib/notifications";
import { isPostingRestricted } from "@/lib/warnings";
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

  if (await isPostingRestricted(Number(user.id))) {
    return { ok: false, error: "Sua conta está com a postagem restrita por advertências." };
  }

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
  await runTrigger("comment.posted", { actorId: userId, targetId: article.authorId });

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
    await createNotification(quoted, "comment.quote", payload);
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
    await createNotification(rid, "comment.reply", payload);
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
    .select({ id: comments.id, authorId: comments.authorId, articleId: comments.articleId, createdAt: comments.createdAt })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!row) return { ok: false, error: "Comentário não encontrado." };
  if (row.authorId !== Number(user.id)) return { ok: false, error: "Você só pode editar seus comentários." };

  const edit = await canEditOwn(user, row.createdAt);
  if (!edit.ok) return { ok: false, error: edit.error };

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

  if (!isMod && !(await canDeleteOwn(user))) {
    return { ok: false, error: "Seu papel não permite excluir conteúdo." };
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

export async function reactAction(articleId: number, reactionId: number): Promise<Result<{ reactionId: number | null }>> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login para reagir." };
  }
  await checkRateLimit(`react:${user.id}`, 30, 60_000);
  const userId = Number(user.id);

  const settings = await getReputationSettings();
  if (!settings.enabled) return { ok: false, error: "Reações estão desativadas." };

  const reaction = await getReaction(reactionId);
  if (!reaction || !reaction.enabled) return { ok: false, error: "Reação inválida." };

  const [a] = await db.select({ slug: articles.slug, authorId: articles.authorId }).from(articles).where(eq(articles.id, articleId)).limit(1);
  if (!a) return { ok: false, error: "Conteúdo não encontrado." };

  if (a.authorId === userId && !settings.reactToOwn) {
    return { ok: false, error: "Você não pode reagir ao próprio conteúdo." };
  }
  if (settings.excludeRoles.length) {
    const [author] = await db.select({ role: users.role }).from(users).where(eq(users.id, a.authorId)).limit(1);
    if (author && settings.excludeRoles.includes(author.role)) {
      return { ok: false, error: "O conteúdo deste autor não aceita reações." };
    }
  }

  const [existing] = await db
    .select({ id: votes.id, reactionId: votes.reactionId })
    .from(votes)
    .where(and(eq(votes.articleId, articleId), eq(votes.userId, userId)))
    .limit(1);

  let current: number | null;
  let isNew = false;
  if (existing) {
    if ((existing.reactionId ?? reactionId) === reactionId && existing.reactionId !== null) {
      // mesma reação → desfaz
      await db.delete(votes).where(eq(votes.id, existing.id));
      await db.update(articles).set({ votesUp: sql`GREATEST(${articles.votesUp} - 1, 0)` }).where(eq(articles.id, articleId));
      current = null;
    } else {
      // troca a reação (sem reaplicar reputação)
      await db.update(votes).set({ reactionId, value: reaction.weight }).where(eq(votes.id, existing.id));
      current = reactionId;
    }
  } else {
    const perDay = await maxReactionsPerDay(user.role);
    if (perDay > 0) {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const [today] = await db.select({ n: count() }).from(votes).where(and(eq(votes.userId, userId), gte(votes.createdAt, since)));
      if ((today?.n ?? 0) >= perDay) {
        return { ok: false, error: `Limite de ${perDay} reações por dia atingido.` };
      }
    }
    await db.insert(votes).values({ userId, articleId, reactionId, value: reaction.weight }).catch(() => {});
    await db.update(articles).set({ votesUp: sql`${articles.votesUp} + 1` }).where(eq(articles.id, articleId));
    current = reactionId;
    isNew = true;
  }

  revalidatePath(`/guias/${a.slug}`);

  // Reputação só na primeira reação (não reverte ao desfazer/trocar), pelo peso:
  // positiva concede via regra (badges/quests/rank-up); negativa subtrai 1.
  if (isNew) {
    if (reaction.weight > 0) {
      await runTrigger("reaction.given", { actorId: userId, targetId: a.authorId });
    } else if (reaction.weight < 0) {
      await db.update(users).set({ reputation: sql`${users.reputation} - 1` }).where(eq(users.id, a.authorId));
    }
  }
  return { ok: true, data: { reactionId: current } };
}
