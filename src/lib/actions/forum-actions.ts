"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, gte, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { forums, forumTopics, forumPosts, forumTopicFollows, forumPostReactions, users } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { evaluateBadges } from "@/lib/badges";
import { runTrigger } from "@/lib/achievements";
import { maxReactionsPerDay } from "@/lib/permissions";
import { getReaction } from "@/lib/reactions";
import { getReputationSettings } from "@/lib/settings";
import { createNotification } from "@/lib/notifications";
import { postingGate, isContentModerated } from "@/lib/warnings";
import { isRichDoc, RichDocSchema, richDocToText } from "@/lib/blocks/rich-schema";
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

const CreateTopicSchema = z.object({
  forumId: z.number().int().positive(),
  title: z.string().trim().min(5, "Título muito curto.").max(200),
  body: z.string(),
  follow: z.boolean().optional(),
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
  const moderated = await isContentModerated(userId);
  const slug = await uniqueTopicSlug(parsed.data.title);
  const now = new Date();

  const topicId = await db.transaction(async (tx) => {
    const topicIns = await tx.insert(forumTopics).values({
      forumId: forum.id, authorId: userId, title: parsed.data.title, slug,
      status: moderated ? "pending" : "open", lastPostAt: now, lastPosterId: userId,
    });
    const tId = insertId(topicIns);
    const postIns = await tx.insert(forumPosts).values({
      topicId: tId, authorId: userId, body: valid.json, isFirst: true, status: moderated ? "flagged" : "visible",
    });
    const pId = insertId(postIns);
    await tx.update(forumTopics).set({ firstPostId: pId, lastPostId: pId }).where(eq(forumTopics.id, tId));
    if (!moderated) {
      await tx.update(forums).set({
        topicsCount: sql`${forums.topicsCount} + 1`, postsCount: sql`${forums.postsCount} + 1`,
        lastPostId: pId, lastPostAt: now, lastPosterId: userId,
      }).where(eq(forums.id, forum.id));
    }
    return tId;
  });

  if (moderated) return { ok: true, data: { forumSlug: forum.slug, topicSlug: slug, pending: true } };

  if (parsed.data.follow !== false) await db.insert(forumTopicFollows).values({ userId, topicId }).catch(() => {});
  await evaluateBadges(userId);
  await runTrigger("forum.topic.created", { actorId: userId });
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
