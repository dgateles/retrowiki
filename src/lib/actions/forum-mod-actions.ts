"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { forums, forumTopics, forumPosts, auditLog } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";

type Result = { ok: boolean; error?: string };

export type BulkTopicAction = "pin" | "unpin" | "lock" | "unlock" | "hide" | "delete";
/** Aplica uma ação de moderação a vários tópicos de uma vez (staff). */
export async function bulkModerateTopicsAction(topicIds: number[], action: BulkTopicAction, forumSlug: string): Promise<Result> {
  const actorId = await staff();
  if (!actorId) return { ok: false, error: "Acesso restrito." };
  const ids = [...new Set(topicIds)].filter((n) => Number.isInteger(n) && n > 0).slice(0, 100);
  if (!ids.length) return { ok: false, error: "Nada selecionado." };

  if (action === "pin" || action === "unpin") {
    await db.update(forumTopics).set({ pinned: action === "pin" }).where(inArray(forumTopics.id, ids));
  } else if (action === "lock" || action === "unlock") {
    // Só alterna tópicos abertos<->trancados (não mexe em hidden/archived/pending).
    await db.update(forumTopics).set({ status: action === "lock" ? "locked" : "open" })
      .where(and(inArray(forumTopics.id, ids), inArray(forumTopics.status, action === "lock" ? ["open"] : ["locked"])));
  } else if (action === "hide") {
    await db.update(forumTopics).set({ status: "hidden" }).where(inArray(forumTopics.id, ids));
  } else if (action === "delete") {
    const rows = await db.select({ id: forumTopics.id, forumId: forumTopics.forumId, postsCount: forumTopics.postsCount })
      .from(forumTopics).where(and(inArray(forumTopics.id, ids), isNull(forumTopics.deletedAt)));
    if (rows.length) {
      await db.update(forumTopics).set({ deletedAt: new Date(), status: "hidden" }).where(inArray(forumTopics.id, rows.map((r) => r.id)));
      // Ajusta contadores por fórum.
      const byForum = new Map<number, { topics: number; posts: number }>();
      for (const r of rows) {
        const e = byForum.get(r.forumId) ?? { topics: 0, posts: 0 };
        e.topics += 1; e.posts += r.postsCount + 1;
        byForum.set(r.forumId, e);
      }
      for (const [forumId, adj] of byForum) {
        await db.update(forums).set({
          topicsCount: sql`GREATEST(${forums.topicsCount} - ${adj.topics}, 0)`,
          postsCount: sql`GREATEST(${forums.postsCount} - ${adj.posts}, 0)`,
        }).where(eq(forums.id, forumId));
      }
    }
  }
  await log(actorId, `forum_bulk_${action}`, `forum_topics:${ids.join(",")}`.slice(0, 250));
  revalidatePath(`/forum/${forumSlug}`);
  return { ok: true };
}

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

// ── Recálculo de agregados (self-healing após mover/mesclar) ────────────────
/** Recalcula os contadores e o "último post" de um fórum a partir dos dados reais. */
async function recomputeForum(forumId: number) {
  const [tc] = await db.select({ n: sql<number>`count(*)` }).from(forumTopics)
    .where(and(eq(forumTopics.forumId, forumId), isNull(forumTopics.deletedAt), inArray(forumTopics.status, ["open", "locked", "archived"] as const)));
  const topicsCount = Number(tc?.n ?? 0);
  // Posts visíveis (1º + respostas) nos tópicos contáveis do fórum.
  const [pc] = await db.select({ n: sql<number>`count(*)` })
    .from(forumPosts).innerJoin(forumTopics, eq(forumTopics.id, forumPosts.topicId))
    .where(and(eq(forumTopics.forumId, forumId), isNull(forumTopics.deletedAt), inArray(forumTopics.status, ["open", "locked", "archived"] as const), isNull(forumPosts.deletedAt), inArray(forumPosts.status, ["visible", "flagged"] as const)));
  const postsCount = Number(pc?.n ?? 0);
  const [last] = await db.select({ id: forumPosts.id, at: forumPosts.createdAt, authorId: forumPosts.authorId })
    .from(forumPosts).innerJoin(forumTopics, eq(forumTopics.id, forumPosts.topicId))
    .where(and(eq(forumTopics.forumId, forumId), isNull(forumTopics.deletedAt), inArray(forumTopics.status, ["open", "locked", "archived"] as const), isNull(forumPosts.deletedAt), inArray(forumPosts.status, ["visible", "flagged"] as const)))
    .orderBy(sql`${forumPosts.createdAt} desc`).limit(1);
  await db.update(forums).set({
    topicsCount, postsCount,
    lastPostId: last?.id ?? null, lastPostAt: last?.at ?? null, lastPosterId: last?.authorId ?? null,
  }).where(eq(forums.id, forumId));
}

/** Recalcula respostas e "último post" de um tópico a partir dos posts reais. */
async function recomputeTopic(topicId: number) {
  const [rc] = await db.select({ n: sql<number>`count(*)` }).from(forumPosts)
    .where(and(eq(forumPosts.topicId, topicId), eq(forumPosts.isFirst, false), isNull(forumPosts.deletedAt)));
  const [last] = await db.select({ id: forumPosts.id, at: forumPosts.createdAt, authorId: forumPosts.authorId })
    .from(forumPosts).where(and(eq(forumPosts.topicId, topicId), isNull(forumPosts.deletedAt)))
    .orderBy(sql`${forumPosts.createdAt} desc`).limit(1);
  await db.update(forumTopics).set({
    postsCount: Number(rc?.n ?? 0),
    lastPostId: last?.id ?? null, lastPostAt: last?.at ?? null, lastPosterId: last?.authorId ?? null,
  }).where(eq(forumTopics.id, topicId));
}

/** Move um tópico para outro fórum (staff). Recalcula os agregados dos dois fóruns. */
export async function moveTopicAction(topicId: number, targetForumId: number): Promise<Result> {
  const actorId = await staff();
  if (!actorId) return { ok: false, error: "Acesso restrito." };
  const [t] = await db.select({ forumId: forumTopics.forumId, deletedAt: forumTopics.deletedAt })
    .from(forumTopics).where(eq(forumTopics.id, topicId)).limit(1);
  if (!t || t.deletedAt) return { ok: false, error: "Tópico indisponível." };
  if (t.forumId === targetForumId) return { ok: false, error: "O tópico já está neste fórum." };
  const [target] = await db.select({ id: forums.id }).from(forums).where(eq(forums.id, targetForumId)).limit(1);
  if (!target) return { ok: false, error: "Fórum de destino não encontrado." };

  const sourceForumId = t.forumId;
  await db.update(forumTopics).set({ forumId: targetForumId }).where(eq(forumTopics.id, topicId));
  await Promise.all([recomputeForum(sourceForumId), recomputeForum(targetForumId)]);
  await log(actorId, "forum_topic_move", `forum_topic:${topicId}->forum:${targetForumId}`);

  const ctx = await topicCtx(topicId);
  const [src] = await db.select({ slug: forums.slug }).from(forums).where(eq(forums.id, sourceForumId)).limit(1);
  if (src) revalidatePath(`/forum/${src.slug}`);
  if (ctx) { revalidatePath(`/forum/${ctx.forumSlug}`); revalidatePath(`/forum/${ctx.forumSlug}/${ctx.slug}`); }
  return { ok: true };
}

/**
 * Mescla o tópico de origem no de destino (staff): move todos os posts da origem
 * para o destino (o 1º post da origem vira resposta), remove a origem e recalcula
 * os agregados de tópicos e fóruns envolvidos.
 */
export async function mergeTopicsAction(sourceTopicId: number, targetTopicId: number): Promise<Result> {
  const actorId = await staff();
  if (!actorId) return { ok: false, error: "Acesso restrito." };
  if (sourceTopicId === targetTopicId) return { ok: false, error: "Escolha dois tópicos diferentes." };
  const [src] = await db.select({ id: forumTopics.id, forumId: forumTopics.forumId, deletedAt: forumTopics.deletedAt })
    .from(forumTopics).where(eq(forumTopics.id, sourceTopicId)).limit(1);
  const [tgt] = await db.select({ id: forumTopics.id, forumId: forumTopics.forumId, deletedAt: forumTopics.deletedAt })
    .from(forumTopics).where(eq(forumTopics.id, targetTopicId)).limit(1);
  if (!src || src.deletedAt) return { ok: false, error: "Tópico de origem indisponível." };
  if (!tgt || tgt.deletedAt) return { ok: false, error: "Tópico de destino indisponível." };

  // Todos os posts da origem passam a pertencer ao destino, como respostas.
  await db.update(forumPosts).set({ topicId: targetTopicId, isFirst: false }).where(eq(forumPosts.topicId, sourceTopicId));
  // A origem some (soft-delete), sem contribuir mais para contadores.
  await db.update(forumTopics).set({ deletedAt: new Date(), status: "hidden", postsCount: 0 }).where(eq(forumTopics.id, sourceTopicId));

  await recomputeTopic(targetTopicId);
  const forumsToFix = [...new Set([src.forumId, tgt.forumId])];
  await Promise.all(forumsToFix.map((fid) => recomputeForum(fid)));
  await log(actorId, "forum_topic_merge", `forum_topic:${sourceTopicId}->topic:${targetTopicId}`);

  const ctx = await topicCtx(targetTopicId);
  if (ctx) { revalidatePath(`/forum/${ctx.forumSlug}`); revalidatePath(`/forum/${ctx.forumSlug}/${ctx.slug}`); }
  return { ok: true };
}

/** Lista de fóruns (destino de mover). */
export async function listForumsForMoveAction(): Promise<{ ok: boolean; data?: { id: number; title: string }[] }> {
  const actorId = await staff();
  if (!actorId) return { ok: false };
  const rows = await db.select({ id: forums.id, title: forums.title }).from(forums)
    .where(eq(forums.visible, true)).orderBy(sql`${forums.sortOrder} asc`, sql`${forums.title} asc`);
  return { ok: true, data: rows };
}

/** Resolve um tópico de destino pela URL ou slug (para o fluxo de mesclar). */
export async function resolveTopicBySlugAction(input: string): Promise<{ ok: boolean; error?: string; data?: { id: number; title: string } }> {
  const actorId = await staff();
  if (!actorId) return { ok: false, error: "Acesso restrito." };
  // Aceita URL completa (…/forum/<forum>/<slug>) ou o slug puro.
  const raw = input.trim();
  const slug = (raw.split("?")[0].replace(/\/+$/, "").split("/").pop() ?? "").trim();
  if (!slug) return { ok: false, error: "Informe a URL ou o slug do tópico." };
  const [t] = await db.select({ id: forumTopics.id, title: forumTopics.title, deletedAt: forumTopics.deletedAt })
    .from(forumTopics).where(eq(forumTopics.slug, slug)).limit(1);
  if (!t || t.deletedAt) return { ok: false, error: "Tópico não encontrado." };
  return { ok: true, data: { id: t.id, title: t.title } };
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
