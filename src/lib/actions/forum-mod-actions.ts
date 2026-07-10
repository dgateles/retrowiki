"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { forums, forumTopics, forumPosts, auditLog } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";

type Result = { ok: boolean; error?: string };

/** Garante staff (moderador/admin) e devolve o id do ator, ou null. */
async function staff(): Promise<number | null> {
  const user = await requireUser().catch(() => null);
  if (!user || !(user.role === "moderator" || user.role === "admin")) return null;
  return Number(user.id);
}
async function log(actorId: number, action: string, target: string) {
  await db.insert(auditLog).values({ actorId, action, target }).catch(() => {});
}
async function topicCtx(topicId: number) {
  const [t] = await db.select({ id: forumTopics.id, slug: forumTopics.slug, forumSlug: forums.slug })
    .from(forumTopics).innerJoin(forums, eq(forums.id, forumTopics.forumId)).where(eq(forumTopics.id, topicId)).limit(1);
  return t ?? null;
}

// ── Tópicos ────────────────────────────────────────────────────────────────
export async function setTopicPinnedAction(topicId: number, pinned: boolean): Promise<Result> {
  const actorId = await staff();
  if (!actorId) return { ok: false, error: "Acesso restrito." };
  await db.update(forumTopics).set({ pinned }).where(eq(forumTopics.id, topicId));
  await log(actorId, pinned ? "forum_topic_pin" : "forum_topic_unpin", `forum_topic:${topicId}`);
  const t = await topicCtx(topicId);
  if (t) revalidatePath(`/forum/${t.forumSlug}`);
  return { ok: true };
}
export async function setTopicLockedAction(topicId: number, locked: boolean): Promise<Result> {
  const actorId = await staff();
  if (!actorId) return { ok: false, error: "Acesso restrito." };
  // Só alterna entre open<->locked (não mexe em hidden/archived/pending).
  await db.update(forumTopics).set({ status: locked ? "locked" : "open" }).where(eq(forumTopics.id, topicId));
  await log(actorId, locked ? "forum_topic_lock" : "forum_topic_unlock", `forum_topic:${topicId}`);
  const t = await topicCtx(topicId);
  if (t) revalidatePath(`/forum/${t.forumSlug}/${t.slug}`);
  return { ok: true };
}
export async function hideTopicAction(topicId: number): Promise<Result> {
  const actorId = await staff();
  if (!actorId) return { ok: false, error: "Acesso restrito." };
  await db.update(forumTopics).set({ status: "hidden" }).where(eq(forumTopics.id, topicId));
  await log(actorId, "forum_topic_hide", `forum_topic:${topicId}`);
  const t = await topicCtx(topicId);
  if (t) { revalidatePath(`/forum/${t.forumSlug}`); revalidatePath(`/forum/${t.forumSlug}/${t.slug}`); }
  return { ok: true };
}
export async function deleteTopicAction(topicId: number): Promise<Result> {
  const actorId = await staff();
  if (!actorId) return { ok: false, error: "Acesso restrito." };
  const [t] = await db.select({ forumId: forumTopics.forumId, postsCount: forumTopics.postsCount, deletedAt: forumTopics.deletedAt })
    .from(forumTopics).where(eq(forumTopics.id, topicId)).limit(1);
  if (!t || t.deletedAt) return { ok: false, error: "Tópico indisponível." };
  await db.update(forumTopics).set({ deletedAt: new Date(), status: "hidden" }).where(eq(forumTopics.id, topicId));
  // Ajusta contadores do fórum (−1 tópico; −(respostas+1º post)).
  await db.update(forums).set({
    topicsCount: sql`GREATEST(${forums.topicsCount} - 1, 0)`,
    postsCount: sql`GREATEST(${forums.postsCount} - ${t.postsCount + 1}, 0)`,
  }).where(eq(forums.id, t.forumId));
  await log(actorId, "forum_topic_delete", `forum_topic:${topicId}`);
  const ctx = await topicCtx(topicId);
  if (ctx) revalidatePath(`/forum/${ctx.forumSlug}`);
  return { ok: true };
}

// ── Posts ──────────────────────────────────────────────────────────────────
async function postCtx(postId: number) {
  const [p] = await db.select({ topicId: forumPosts.topicId, isFirst: forumPosts.isFirst, slug: forumTopics.slug, forumSlug: forums.slug, forumId: forums.id })
    .from(forumPosts).innerJoin(forumTopics, eq(forumTopics.id, forumPosts.topicId)).innerJoin(forums, eq(forums.id, forumTopics.forumId))
    .where(eq(forumPosts.id, postId)).limit(1);
  return p ?? null;
}
export async function hidePostAction(postId: number): Promise<Result> {
  const actorId = await staff();
  if (!actorId) return { ok: false, error: "Acesso restrito." };
  const p = await postCtx(postId);
  if (p?.isFirst) return { ok: false, error: "Este é o post de abertura — oculte o tópico." };
  await db.update(forumPosts).set({ status: "hidden" }).where(eq(forumPosts.id, postId));
  await log(actorId, "forum_post_hide", `forum_post:${postId}`);
  if (p) revalidatePath(`/forum/${p.forumSlug}/${p.slug}`);
  return { ok: true };
}
export async function deletePostAction(postId: number): Promise<Result> {
  const actorId = await staff();
  if (!actorId) return { ok: false, error: "Acesso restrito." };
  const p = await postCtx(postId);
  if (!p) return { ok: false, error: "Post não encontrado." };
  if (p.isFirst) return { ok: false, error: "Este é o post de abertura — exclua o tópico." };
  await db.update(forumPosts).set({ deletedAt: new Date(), status: "hidden" }).where(eq(forumPosts.id, postId));
  await db.update(forumTopics).set({ postsCount: sql`GREATEST(${forumTopics.postsCount} - 1, 0)` }).where(eq(forumTopics.id, p.topicId));
  await db.update(forums).set({ postsCount: sql`GREATEST(${forums.postsCount} - 1, 0)` }).where(eq(forums.id, p.forumId));
  await log(actorId, "forum_post_delete", `forum_post:${postId}`);
  revalidatePath(`/forum/${p.forumSlug}/${p.slug}`);
  return { ok: true };
}
