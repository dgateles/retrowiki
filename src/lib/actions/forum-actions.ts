"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { forums, forumTopics, forumPosts, forumTopicFollows, forumPostReactions, forumPolls, forumPollQuestions, forumPollChoices, forumPollVotes, users } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { evaluateBadges } from "@/lib/badges";
import { runTrigger } from "@/lib/achievements";
import { maxReactionsPerDay } from "@/lib/permissions";
import { getReaction } from "@/lib/reactions";
import { getReputationSettings } from "@/lib/settings";
import { createNotification } from "@/lib/notifications";
import { postingGate, isContentModerated } from "@/lib/warnings";
import { isRichDoc, RichDocSchema, richDocToText, collectMentionHandles } from "@/lib/blocks/rich-schema";
import { canPostForum, uniqueTopicSlug } from "@/lib/forum";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };
// O insert do drizzle/mysql2 devolve [ResultSetHeader, ...] — o insertId está no [0].
const insertId = (r: unknown) => (r as unknown as [{ insertId: number }])[0].insertId;
const isStaff = (role: string) => role === "moderator" || role === "admin";

/** Valida e serializa o corpo rico (mesma allowlist dos comentários/guias). */
function validateForumBody(raw: unknown): { ok: true; json: string; text: string } | { ok: false; error: string } {
  if (typeof raw !== "string" || raw.length > 200_000) return { ok: false, error: "Mensagem inválida." };
  let doc: unknown;
  try { doc = JSON.parse(raw); } catch { return { ok: false, error: "Mensagem inválida." }; }
  if (!isRichDoc(doc)) return { ok: false, error: "Mensagem inválida." };
  const parsed = RichDocSchema.safeParse(doc);
  if (!parsed.success) return { ok: false, error: "Mensagem inválida." };
  const text = richDocToText(parsed.data);
  if (text.trim().length < 2) return { ok: false, error: "Mensagem muito curta." };
  if (text.length > 20000) return { ok: false, error: "Mensagem muito longa." };
  return { ok: true, json: JSON.stringify(parsed.data), text };
}

const PollSchema = z.object({
  title: z.string().trim().max(200).optional(),
  publicVoters: z.boolean().optional(),
  closesAt: z.string().datetime().nullable().optional(),
  questions: z.array(z.object({
    title: z.string().trim().min(1, "Pergunta vazia.").max(300),
    multiple: z.boolean().optional(),
    choices: z.array(z.string().trim().min(1).max(300)).min(2, "Cada pergunta precisa de ao menos 2 opções.").max(30),
  })).min(1).max(10),
});
/** Notifica os usuários @mencionados no corpo (exceto o autor e quem já foi
 * notificado). Best-effort — nunca bloqueia o fluxo. */
async function notifyForumMentions(
  bodyJson: string,
  ctx: { forumSlug: string; topicSlug: string; topicTitle: string; postId: number },
  actorId: number,
  exclude: Set<number>,
): Promise<void> {
  try {
    const doc = JSON.parse(bodyJson);
    if (!isRichDoc(doc)) return;
    const handles = collectMentionHandles(doc);
    if (!handles.length) return;
    const mentioned = await db.select({ id: users.id }).from(users).where(inArray(users.handle, handles));
    if (!mentioned.length) return;
    const [me] = await db.select({ name: users.displayName, avatar: users.avatarUrl }).from(users).where(eq(users.id, actorId)).limit(1);
    const payload = { forumSlug: ctx.forumSlug, topicSlug: ctx.topicSlug, topicTitle: ctx.topicTitle, postId: ctx.postId || undefined, actorName: me?.name ?? "Alguém", actorAvatar: me?.avatar ?? null };
    for (const u of mentioned) {
      if (u.id === actorId || exclude.has(u.id)) continue;
      await createNotification(u.id, "forum.mention", payload);
    }
  } catch {
    // ignora
  }
}

const CreateTopicSchema = z.object({
  forumId: z.number().int().positive(),
  title: z.string().trim().min(5, "Título muito curto.").max(200),
  body: z.string(),
  follow: z.boolean().optional(),
  isQuestion: z.boolean().optional(),
  poll: PollSchema.optional(),
  options: z.object({ lock: z.boolean().optional(), pin: z.boolean().optional(), hide: z.boolean().optional() }).optional(),
});
const ReplySchema = z.object({ topicId: z.number().int().positive(), body: z.string(), follow: z.boolean().optional() });

// ── Criar tópico ───────────────────────────────────────────────────────────
export async function createTopicAction(input: unknown): Promise<Result<{ forumSlug: string; topicSlug: string; pending?: boolean }>> {
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Faça login para criar um tópico." };
  const rl = await checkRateLimit(`forum:topic:${user.id}`, 5, 10 * 60_000);
  if (!rl.ok) return { ok: false, error: "Muitos tópicos em pouco tempo. Aguarde." };
  const gate = await postingGate(Number(user.id));
  if (!gate.ok) return { ok: false, error: gate.error };

  const parsed = CreateTopicSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const valid = validateForumBody(parsed.data.body);
  if (!valid.ok) return { ok: false, error: valid.error };

  const [forum] = await db.select({ id: forums.id, slug: forums.slug, locked: forums.locked, minPostRole: forums.minPostRole, visible: forums.visible })
    .from(forums).where(eq(forums.id, parsed.data.forumId)).limit(1);
  if (!forum || !forum.visible) return { ok: false, error: "Fórum indisponível." };
  if (!canPostForum(forum, user.role)) return { ok: false, error: "Você não pode postar neste fórum." };

  const userId = Number(user.id);
  const staff = isStaff(user.role);
  const moderated = await isContentModerated(userId);
  const slug = await uniqueTopicSlug(parsed.data.title);
  const now = new Date();

  // Opções pós-publicação (só staff, e não sobrescrevem a moderação).
  const opts = parsed.data.options ?? {};
  let status: "open" | "locked" | "hidden" | "pending" = moderated ? "pending" : "open";
  let pinned = false;
  if (!moderated && staff) {
    if (opts.hide) status = "hidden";
    else if (opts.lock) status = "locked";
    if (opts.pin) pinned = true;
  }
  const countsPublic = status === "open" || status === "locked";

  // Enquete (validação leve extra: data de fechamento no futuro).
  const pollInput = parsed.data.poll;
  let closesAt: Date | null = null;
  if (pollInput?.closesAt) {
    const d = new Date(pollInput.closesAt);
    if (!Number.isNaN(d.getTime()) && d.getTime() > now.getTime()) closesAt = d;
  }

  const topicId = await db.transaction(async (tx) => {
    const topicIns = await tx.insert(forumTopics).values({
      forumId: forum.id, authorId: userId, title: parsed.data.title, slug,
      status, pinned, isQuestion: parsed.data.isQuestion ?? false, lastPostAt: now, lastPosterId: userId,
    });
    const tId = insertId(topicIns);
    const postIns = await tx.insert(forumPosts).values({
      topicId: tId, authorId: userId, body: valid.json, isFirst: true, status: moderated ? "flagged" : "visible",
    });
    const pId = insertId(postIns);
    await tx.update(forumTopics).set({ firstPostId: pId, lastPostId: pId }).where(eq(forumTopics.id, tId));
    if (countsPublic) {
      await tx.update(forums).set({
        topicsCount: sql`${forums.topicsCount} + 1`, postsCount: sql`${forums.postsCount} + 1`,
        lastPostId: pId, lastPostAt: now, lastPosterId: userId,
      }).where(eq(forums.id, forum.id));
    }
    // Enquete
    if (pollInput) {
      const pollIns = await tx.insert(forumPolls).values({
        topicId: tId, title: pollInput.title?.trim() || null, publicVoters: pollInput.publicVoters ?? false, closesAt,
      });
      const pollId = insertId(pollIns);
      for (let qi = 0; qi < pollInput.questions.length; qi++) {
        const q = pollInput.questions[qi];
        const qIns = await tx.insert(forumPollQuestions).values({ pollId, title: q.title.trim(), multiple: q.multiple ?? false, sortOrder: qi });
        const qId = insertId(qIns);
        await tx.insert(forumPollChoices).values(q.choices.map((label, ci) => ({ questionId: qId, label: label.trim(), sortOrder: ci })));
      }
    }
    return tId;
  });

  if (moderated) return { ok: true, data: { forumSlug: forum.slug, topicSlug: slug, pending: true } };

  if (parsed.data.follow !== false) await db.insert(forumTopicFollows).values({ userId, topicId }).catch(() => {});
  await evaluateBadges(userId);
  await runTrigger("forum.topic.created", { actorId: userId });
  await notifyForumMentions(valid.json, { forumSlug: forum.slug, topicSlug: slug, topicTitle: parsed.data.title, postId: 0 }, userId, new Set());
  revalidatePath("/forum");
  revalidatePath(`/forum/${forum.slug}`);
  return { ok: true, data: { forumSlug: forum.slug, topicSlug: slug } };
}

// ── Responder ──────────────────────────────────────────────────────────────
export async function replyTopicAction(input: unknown): Promise<Result<{ forumSlug: string; topicSlug: string; postId?: number; pending?: boolean }>> {
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Faça login para responder." };
  const rl = await checkRateLimit(`forum:reply:${user.id}`, 15, 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas respostas. Aguarde um momento." };
  const gate = await postingGate(Number(user.id));
  if (!gate.ok) return { ok: false, error: gate.error };

  const parsed = ReplySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };
  const valid = validateForumBody(parsed.data.body);
  if (!valid.ok) return { ok: false, error: valid.error };

  const [t] = await db.select({
    id: forumTopics.id, slug: forumTopics.slug, status: forumTopics.status, authorId: forumTopics.authorId, title: forumTopics.title,
    forumId: forums.id, forumSlug: forums.slug, forumLocked: forums.locked, forumMinPostRole: forums.minPostRole, forumVisible: forums.visible,
  }).from(forumTopics).innerJoin(forums, eq(forums.id, forumTopics.forumId)).where(eq(forumTopics.id, parsed.data.topicId)).limit(1);
  if (!t || !t.forumVisible || t.status === "hidden" || t.status === "pending") return { ok: false, error: "Tópico indisponível." };
  if ((t.status === "locked" || t.status === "archived") && !isStaff(user.role)) return { ok: false, error: "Tópico trancado." };
  if (!canPostForum({ locked: t.forumLocked, minPostRole: t.forumMinPostRole }, user.role)) return { ok: false, error: "Você não pode postar aqui." };

  const userId = Number(user.id);
  const moderated = await isContentModerated(userId);
  const now = new Date();

  const postId = await db.transaction(async (tx) => {
    const ins = await tx.insert(forumPosts).values({ topicId: t.id, authorId: userId, body: valid.json, status: moderated ? "flagged" : "visible" });
    const pId = insertId(ins);
    if (!moderated) {
      await tx.update(forumTopics).set({ postsCount: sql`${forumTopics.postsCount} + 1`, lastPostId: pId, lastPostAt: now, lastPosterId: userId }).where(eq(forumTopics.id, t.id));
      await tx.update(forums).set({ postsCount: sql`${forums.postsCount} + 1`, lastPostId: pId, lastPostAt: now, lastPosterId: userId }).where(eq(forums.id, t.forumId));
    }
    return pId;
  });

  if (moderated) return { ok: true, data: { forumSlug: t.forumSlug, topicSlug: t.slug, pending: true } };

  if (parsed.data.follow !== false) await db.insert(forumTopicFollows).values({ userId, topicId: t.id }).catch(() => {});
  await evaluateBadges(userId);
  await runTrigger("forum.reply.posted", { actorId: userId, targetId: t.authorId });

  // Notifica autor do tópico + seguidores (menos quem respondeu).
  const [me] = await db.select({ name: users.displayName, avatar: users.avatarUrl }).from(users).where(eq(users.id, userId)).limit(1);
  const payload = { forumSlug: t.forumSlug, topicSlug: t.slug, topicTitle: t.title, postId, actorName: me?.name ?? "Alguém", actorAvatar: me?.avatar ?? null };
  const followers = await db.select({ userId: forumTopicFollows.userId }).from(forumTopicFollows).where(and(eq(forumTopicFollows.topicId, t.id), ne(forumTopicFollows.userId, userId)));
  const recipients = new Set<number>(followers.map((f) => f.userId));
  if (t.authorId !== userId) recipients.add(t.authorId);
  for (const rid of recipients) await createNotification(rid, "forum.reply", payload);
  await notifyForumMentions(valid.json, { forumSlug: t.forumSlug, topicSlug: t.slug, topicTitle: t.title, postId }, userId, recipients);

  revalidatePath(`/forum/${t.forumSlug}/${t.slug}`);
  return { ok: true, data: { forumSlug: t.forumSlug, topicSlug: t.slug, postId } };
}

// ── Seguir / deixar de seguir ──────────────────────────────────────────────
export async function toggleFollowTopicAction(topicId: number): Promise<Result<{ following: boolean }>> {
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Faça login." };
  const userId = Number(user.id);
  const [existing] = await db.select({ id: forumTopicFollows.id }).from(forumTopicFollows)
    .where(and(eq(forumTopicFollows.topicId, topicId), eq(forumTopicFollows.userId, userId))).limit(1);
  if (existing) {
    await db.delete(forumTopicFollows).where(eq(forumTopicFollows.id, existing.id));
    return { ok: true, data: { following: false } };
  }
  await db.insert(forumTopicFollows).values({ userId, topicId }).catch(() => {});
  return { ok: true, data: { following: true } };
}

// ── Reagir a um post ───────────────────────────────────────────────────────
const VotePollSchema = z.object({ pollId: z.number().int().positive(), choiceIds: z.array(z.number().int().positive()).min(1).max(200) });
export async function votePollAction(input: unknown): Promise<Result> {
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Faça login para votar." };
  const parsed = VotePollSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };
  const userId = Number(user.id);
  const rl = await checkRateLimit(`forum:poll:${userId}`, 20, 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas ações. Aguarde." };

  const [poll] = await db.select({ id: forumPolls.id, topicId: forumPolls.topicId, closesAt: forumPolls.closesAt })
    .from(forumPolls).where(eq(forumPolls.id, parsed.data.pollId)).limit(1);
  if (!poll) return { ok: false, error: "Enquete não encontrada." };
  if (poll.closesAt && poll.closesAt.getTime() <= Date.now()) return { ok: false, error: "Enquete encerrada." };

  // Já votou?
  const [prev] = await db.select({ id: forumPollVotes.id }).from(forumPollVotes)
    .where(and(eq(forumPollVotes.pollId, poll.id), eq(forumPollVotes.userId, userId))).limit(1);
  if (prev) return { ok: false, error: "Você já votou nesta enquete." };

  // Perguntas + opções válidas da enquete.
  const questions = await db.select({ id: forumPollQuestions.id, multiple: forumPollQuestions.multiple }).from(forumPollQuestions).where(eq(forumPollQuestions.pollId, poll.id));
  const qIds = questions.map((q) => q.id);
  const choices = qIds.length ? await db.select({ id: forumPollChoices.id, questionId: forumPollChoices.questionId }).from(forumPollChoices).where(inArray(forumPollChoices.questionId, qIds)) : [];
  const choiceById = new Map(choices.map((c) => [c.id, c]));

  const chosen = [...new Set(parsed.data.choiceIds)];
  if (chosen.some((id) => !choiceById.has(id))) return { ok: false, error: "Opção inválida." };
  // Agrupa por pergunta e valida escolha única.
  const byQuestion = new Map<number, number[]>();
  for (const id of chosen) {
    const qid = choiceById.get(id)!.questionId;
    byQuestion.set(qid, [...(byQuestion.get(qid) ?? []), id]);
  }
  for (const q of questions) {
    const picks = byQuestion.get(q.id) ?? [];
    if (picks.length === 0) return { ok: false, error: "Responda todas as perguntas." };
    if (!q.multiple && picks.length > 1) return { ok: false, error: "Escolha apenas uma opção por pergunta." };
  }

  await db.transaction(async (tx) => {
    for (const id of chosen) {
      const c = choiceById.get(id)!;
      await tx.insert(forumPollVotes).values({ pollId: poll.id, questionId: c.questionId, choiceId: id, userId });
      await tx.update(forumPollChoices).set({ votesCount: sql`${forumPollChoices.votesCount} + 1` }).where(eq(forumPollChoices.id, id));
    }
  });

  const [ctx] = await db.select({ slug: forumTopics.slug, forumSlug: forums.slug })
    .from(forumTopics).innerJoin(forums, eq(forums.id, forumTopics.forumId)).where(eq(forumTopics.id, poll.topicId)).limit(1);
  if (ctx) revalidatePath(`/forum/${ctx.forumSlug}/${ctx.slug}`);
  return { ok: true };
}

const EditPostSchema = z.object({ postId: z.number().int().positive(), body: z.string() });
export async function editForumPostAction(input: unknown): Promise<Result> {
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Faça login." };
  const parsed = EditPostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };
  const valid = validateForumBody(parsed.data.body);
  if (!valid.ok) return { ok: false, error: valid.error };
  const userId = Number(user.id);
  const [post] = await db.select({ id: forumPosts.id, authorId: forumPosts.authorId, topicId: forumPosts.topicId, deletedAt: forumPosts.deletedAt })
    .from(forumPosts).where(eq(forumPosts.id, parsed.data.postId)).limit(1);
  if (!post || post.deletedAt) return { ok: false, error: "Post não encontrado." };
  const isOwner = post.authorId === userId;
  if (!isOwner && !isStaff(user.role)) return { ok: false, error: "Sem permissão para editar." };
  const rl = await checkRateLimit(`forum:edit:${userId}`, 20, 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas edições. Aguarde." };
  await db.update(forumPosts).set({ body: valid.json, editedAt: new Date(), editedById: userId }).where(eq(forumPosts.id, post.id));
  const [ctx] = await db.select({ slug: forumTopics.slug, forumSlug: forums.slug })
    .from(forumTopics).innerJoin(forums, eq(forums.id, forumTopics.forumId)).where(eq(forumTopics.id, post.topicId)).limit(1);
  if (ctx) revalidatePath(`/forum/${ctx.forumSlug}/${ctx.slug}`);
  return { ok: true };
}

const SOLUTION_REP = 5;
/** Marca (ou desmarca) uma resposta como a solução de uma pergunta. Autor da
 * pergunta ou staff. Transfere reputação para o autor da resposta aceita. */
export async function markSolutionAction(topicId: number, postId: number): Promise<Result<{ solved: boolean }>> {
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Faça login." };
  const userId = Number(user.id);
  const [topic] = await db.select({
    id: forumTopics.id, authorId: forumTopics.authorId, isQuestion: forumTopics.isQuestion, bestPostId: forumTopics.bestPostId,
    title: forumTopics.title, slug: forumTopics.slug, forumSlug: forums.slug,
  }).from(forumTopics).innerJoin(forums, eq(forums.id, forumTopics.forumId)).where(eq(forumTopics.id, topicId)).limit(1);
  if (!topic) return { ok: false, error: "Tópico não encontrado." };
  if (!topic.isQuestion) return { ok: false, error: "Este tópico não é uma pergunta." };
  const isOwner = topic.authorId === userId;
  if (!isOwner && !isStaff(user.role)) return { ok: false, error: "Só o autor da pergunta ou a moderação podem marcar a solução." };

  const [post] = await db.select({ id: forumPosts.id, authorId: forumPosts.authorId, isFirst: forumPosts.isFirst, status: forumPosts.status, deletedAt: forumPosts.deletedAt })
    .from(forumPosts).where(and(eq(forumPosts.id, postId), eq(forumPosts.topicId, topicId))).limit(1);
  if (!post || post.isFirst || post.deletedAt || post.status !== "visible") return { ok: false, error: "Resposta inválida." };

  const toggleOff = topic.bestPostId === postId;
  const newBest = toggleOff ? null : postId;

  // Autor da resposta que perde o status atual (se houver e mudar).
  let prevAnswerId: number | null = null;
  if (topic.bestPostId && topic.bestPostId !== newBest) {
    const [prev] = await db.select({ authorId: forumPosts.authorId }).from(forumPosts).where(eq(forumPosts.id, topic.bestPostId)).limit(1);
    prevAnswerId = prev?.authorId ?? null;
  }

  await db.update(forumTopics).set({ bestPostId: newBest }).where(eq(forumTopics.id, topicId));

  // Reputação: remove do autor anterior (se não for o autor da pergunta) e dá ao novo.
  if (prevAnswerId && prevAnswerId !== topic.authorId) {
    await db.update(users).set({ reputation: sql`GREATEST(${users.reputation} - ${SOLUTION_REP}, 0)` }).where(eq(users.id, prevAnswerId));
  }
  if (newBest && post.authorId !== topic.authorId) {
    await db.update(users).set({ reputation: sql`${users.reputation} + ${SOLUTION_REP}` }).where(eq(users.id, post.authorId));
    if (post.authorId !== userId) {
      const [me] = await db.select({ name: users.displayName, avatar: users.avatarUrl }).from(users).where(eq(users.id, userId)).limit(1);
      await createNotification(post.authorId, "forum.solution", {
        forumSlug: topic.forumSlug, topicSlug: topic.slug, topicTitle: topic.title, postId, actorName: me?.name ?? "Alguém", actorAvatar: me?.avatar ?? null,
      });
    }
  }

  revalidatePath(`/forum/${topic.forumSlug}/${topic.slug}`);
  revalidatePath(`/forum/${topic.forumSlug}`);
  return { ok: true, data: { solved: !!newBest } };
}

export async function reactForumPostAction(postId: number, reactionId: number): Promise<Result<{ reactionId: number | null }>> {
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Faça login para reagir." };
  const rl = await checkRateLimit(`forum:react:${user.id}`, 30, 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas reações. Aguarde um momento." };
  const userId = Number(user.id);
  const settings = await getReputationSettings();
  if (!settings.enabled) return { ok: false, error: "Reações estão desativadas." };
  const reaction = await getReaction(reactionId);
  if (!reaction || !reaction.enabled) return { ok: false, error: "Reação inválida." };

  const [post] = await db.select({ id: forumPosts.id, authorId: forumPosts.authorId, topicId: forumPosts.topicId })
    .from(forumPosts).where(eq(forumPosts.id, postId)).limit(1);
  if (!post) return { ok: false, error: "Post não encontrado." };
  if (post.authorId === userId && !settings.reactToOwn) return { ok: false, error: "Você não pode reagir ao próprio post." };

  const [ctx] = await db.select({ slug: forumTopics.slug, forumSlug: forums.slug })
    .from(forumTopics).innerJoin(forums, eq(forums.id, forumTopics.forumId)).where(eq(forumTopics.id, post.topicId)).limit(1);

  const [existing] = await db.select({ id: forumPostReactions.id, reactionId: forumPostReactions.reactionId })
    .from(forumPostReactions).where(and(eq(forumPostReactions.postId, postId), eq(forumPostReactions.userId, userId))).limit(1);

  let current: number | null;
  let isNew = false;
  if (existing) {
    if (existing.reactionId === reactionId) {
      await db.delete(forumPostReactions).where(eq(forumPostReactions.id, existing.id));
      current = null;
    } else {
      await db.update(forumPostReactions).set({ reactionId, value: reaction.weight }).where(eq(forumPostReactions.id, existing.id));
      current = reactionId;
    }
  } else {
    const perDay = await maxReactionsPerDay(user.role);
    if (perDay > 0) {
      const since = new Date(); since.setHours(0, 0, 0, 0);
      const [today] = await db.select({ n: count() }).from(forumPostReactions).where(and(eq(forumPostReactions.userId, userId), gte(forumPostReactions.createdAt, since)));
      if ((today?.n ?? 0) >= perDay) return { ok: false, error: `Limite de ${perDay} reações por dia atingido.` };
    }
    await db.insert(forumPostReactions).values({ userId, postId, reactionId, value: reaction.weight }).catch(() => {});
    current = reactionId;
    isNew = true;
  }

  if (ctx) revalidatePath(`/forum/${ctx.forumSlug}/${ctx.slug}`);

  // Reputação só na primeira reação (não reverte ao desfazer/trocar).
  if (isNew) {
    if (reaction.weight > 0) await runTrigger("reaction.given", { actorId: userId, targetId: post.authorId });
    else if (reaction.weight < 0) await db.update(users).set({ reputation: sql`GREATEST(${users.reputation} - 1, 0)` }).where(eq(users.id, post.authorId));
  }
  return { ok: true, data: { reactionId: current } };
}
