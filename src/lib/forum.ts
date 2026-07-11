import "server-only";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import { forumCategories, forums, forumTopics, forumPosts, forumTopicFollows, forumTags, forumTopicTags, forumPrefixes, users } from "@/db/schema";
import { isRichDoc } from "@/lib/blocks/rich-schema";
import { slugify } from "@/lib/utils";
import type { UserRole, ForumPrefixColor } from "@/db/schema";

const ROLE_RANK: Record<UserRole, number> = { member: 0, contributor: 1, moderator: 2, admin: 3 };
export function roleAtLeast(role: UserRole | null | undefined, min: UserRole): boolean {
  return !!role && ROLE_RANK[role] >= ROLE_RANK[min];
}

export const TOPICS_PER_PAGE = 20;
export const POSTS_PER_PAGE = 15;

/** Converte o corpo salvo (JSON rico ou texto antigo) num doc para o editor/render. */
export function forumDocFromBody(body: string): unknown {
  try {
    const p = JSON.parse(body);
    if (isRichDoc(p)) return p;
  } catch {
    // texto puro antigo
  }
  return { type: "doc", content: [{ type: "paragraph", content: body.trim() ? [{ type: "text", text: body }] : [] }] };
}

// ── ACL por fórum ──────────────────────────────────────────────────────────
export function canReadForum(f: { minReadRole: UserRole; visible: boolean }, viewerRole: UserRole | null): boolean {
  if (!f.visible) return roleAtLeast(viewerRole, "moderator"); // staff vê oculto
  if (f.minReadRole === "member") return true; // 'member' aqui = "logado"; leitura pública liberamos abaixo
  return roleAtLeast(viewerRole, f.minReadRole);
}
/** Leitura pública: fóruns com minReadRole 'member' são visíveis a visitante também. */
export function canReadForumPublic(f: { minReadRole: UserRole; visible: boolean }, viewerRole: UserRole | null): boolean {
  if (!f.visible) return roleAtLeast(viewerRole, "moderator");
  if (f.minReadRole === "member") return true;
  return roleAtLeast(viewerRole, f.minReadRole);
}
export function canPostForum(f: { minPostRole: UserRole; locked: boolean }, viewerRole: UserRole | null): boolean {
  if (f.locked) return roleAtLeast(viewerRole, "moderator"); // trancado: só staff
  return roleAtLeast(viewerRole, f.minPostRole);
}

// ── Slugs únicos ───────────────────────────────────────────────────────────
async function uniqueSlug(base: string, exists: (s: string) => Promise<boolean>, fallback: string): Promise<string> {
  const root = slugify(base).slice(0, 180) || fallback;
  if (!(await exists(root))) return root;
  for (let i = 2; i < 60; i++) {
    const s = `${root}-${i}`;
    if (!(await exists(s))) return s;
  }
  return `${root}-${Date.now().toString(36)}`;
}
export function uniqueForumSlug(base: string): Promise<string> {
  return uniqueSlug(base, async (s) => !!(await db.select({ id: forums.id }).from(forums).where(eq(forums.slug, s)).limit(1))[0], "forum");
}
export function uniqueTopicSlug(base: string): Promise<string> {
  return uniqueSlug(base, async (s) => !!(await db.select({ id: forumTopics.id }).from(forumTopics).where(eq(forumTopics.slug, s)).limit(1))[0], "topico");
}

// ── Índice (categorias → fóruns) ───────────────────────────────────────────
export type SubForumLink = { id: number; title: string; slug: string; topicsCount: number; locked: boolean };
export type ForumListItem = {
  id: number; title: string; slug: string; description: string | null; icon: string | null;
  topicsCount: number; postsCount: number; locked: boolean; minReadRole: UserRole; minPostRole: UserRole; visible: boolean;
  lastPostAt: Date | null; lastPosterHandle: string | null; lastPosterName: string | null;
  subForums?: SubForumLink[];
};
export type ForumIndexCategory = { id: number; title: string; description: string | null; forums: ForumListItem[] };

export async function getForumIndex(viewerRole: UserRole | null): Promise<ForumIndexCategory[]> {
  try {
    const cats = await db.select().from(forumCategories).where(eq(forumCategories.visible, true)).orderBy(asc(forumCategories.sortOrder), asc(forumCategories.id));
    if (cats.length === 0) return [];
    const rows = await db
      .select({
        id: forums.id, categoryId: forums.categoryId, parentId: forums.parentId, title: forums.title, slug: forums.slug, description: forums.description,
        icon: forums.icon, topicsCount: forums.topicsCount, postsCount: forums.postsCount, locked: forums.locked,
        minReadRole: forums.minReadRole, minPostRole: forums.minPostRole, visible: forums.visible,
        lastPostAt: forums.lastPostAt, lastPosterHandle: users.handle, lastPosterName: users.displayName, sortOrder: forums.sortOrder,
      })
      .from(forums)
      .leftJoin(users, eq(users.id, forums.lastPosterId))
      .orderBy(asc(forums.sortOrder), asc(forums.id));
    const readable = rows.filter((r) => canReadForumPublic(r, viewerRole));
    // Sub-fóruns agrupados pelo pai (só os legíveis).
    const childrenByParent = new Map<number, SubForumLink[]>();
    for (const r of readable) {
      if (r.parentId == null) continue;
      const arr = childrenByParent.get(r.parentId) ?? [];
      arr.push({ id: r.id, title: r.title, slug: r.slug, topicsCount: r.topicsCount, locked: r.locked });
      childrenByParent.set(r.parentId, arr);
    }
    return cats
      .map((c) => ({
        id: c.id, title: c.title, description: c.description,
        forums: readable
          .filter((r) => r.categoryId === c.id && r.parentId == null)
          .map((r) => ({
            id: r.id, title: r.title, slug: r.slug, description: r.description, icon: r.icon,
            topicsCount: r.topicsCount, postsCount: r.postsCount, locked: r.locked,
            minReadRole: r.minReadRole, minPostRole: r.minPostRole, visible: r.visible,
            lastPostAt: r.lastPostAt, lastPosterHandle: r.lastPosterHandle, lastPosterName: r.lastPosterName,
            subForums: childrenByParent.get(r.id),
          })),
      }))
      .filter((c) => c.forums.length > 0);
  } catch {
    return [];
  }
}

export async function getForumBySlug(slug: string): Promise<ForumListItem | null> {
  try {
    const [r] = await db
      .select({
        id: forums.id, title: forums.title, slug: forums.slug, description: forums.description, icon: forums.icon,
        topicsCount: forums.topicsCount, postsCount: forums.postsCount, locked: forums.locked,
        minReadRole: forums.minReadRole, minPostRole: forums.minPostRole, visible: forums.visible,
        lastPostAt: forums.lastPostAt, lastPosterHandle: users.handle, lastPosterName: users.displayName,
      })
      .from(forums)
      .leftJoin(users, eq(users.id, forums.lastPosterId))
      .where(eq(forums.slug, slug))
      .limit(1);
    return r ?? null;
  } catch {
    return null;
  }
}

/** Sub-fóruns de um fórum (para a seção "Sub-fóruns" dentro dele), já filtrados
 * pela leitura do visitante. */
export async function listSubForums(parentId: number, viewerRole: UserRole | null): Promise<ForumListItem[]> {
  try {
    const rows = await db
      .select({
        id: forums.id, title: forums.title, slug: forums.slug, description: forums.description, icon: forums.icon,
        topicsCount: forums.topicsCount, postsCount: forums.postsCount, locked: forums.locked,
        minReadRole: forums.minReadRole, minPostRole: forums.minPostRole, visible: forums.visible,
        lastPostAt: forums.lastPostAt, lastPosterHandle: users.handle, lastPosterName: users.displayName,
      })
      .from(forums)
      .leftJoin(users, eq(users.id, forums.lastPosterId))
      .where(eq(forums.parentId, parentId))
      .orderBy(asc(forums.sortOrder), asc(forums.id));
    return rows.filter((r) => canReadForumPublic(r, viewerRole));
  } catch {
    return [];
  }
}

// ── Lista de tópicos de um fórum ───────────────────────────────────────────
export type TopicTag = { name: string; slug: string };
export type TopicPrefix = { label: string; slug: string; color: ForumPrefixColor };
export type TopicRow = {
  id: number; title: string; slug: string; status: string; pinned: boolean; isQuestion: boolean; bestPostId: number | null;
  views: number; postsCount: number; createdAt: Date; lastPostAt: Date | null;
  authorHandle: string; authorName: string; lastPosterHandle: string | null; lastPosterName: string | null;
  prefix: TopicPrefix | null; tags: TopicTag[];
};
export async function listTopics(forumId: number, page: number, tagSlug?: string, prefixSlug?: string): Promise<{ items: TopicRow[]; hasMore: boolean }> {
  const p = Math.max(1, page);
  const lp = alias(users, "lp"); // segundo join a users: o último a postar
  try {
    const conds = [eq(forumTopics.forumId, forumId), inArray(forumTopics.status, ["open", "locked", "archived"] as const), isNull(forumTopics.deletedAt)];
    if (tagSlug) {
      const [tag] = await db.select({ id: forumTags.id }).from(forumTags).where(eq(forumTags.slug, tagSlug)).limit(1);
      if (!tag) return { items: [], hasMore: false };
      conds.push(inArray(forumTopics.id, db.select({ id: forumTopicTags.topicId }).from(forumTopicTags).where(eq(forumTopicTags.tagId, tag.id))));
    }
    if (prefixSlug) {
      const [pref] = await db.select({ id: forumPrefixes.id }).from(forumPrefixes).where(eq(forumPrefixes.slug, prefixSlug)).limit(1);
      if (!pref) return { items: [], hasMore: false };
      conds.push(eq(forumTopics.prefixId, pref.id));
    }
    const rows = await db
      .select({
        id: forumTopics.id, title: forumTopics.title, slug: forumTopics.slug, status: forumTopics.status,
        pinned: forumTopics.pinned, isQuestion: forumTopics.isQuestion, bestPostId: forumTopics.bestPostId,
        views: forumTopics.views, postsCount: forumTopics.postsCount, createdAt: forumTopics.createdAt, lastPostAt: forumTopics.lastPostAt,
        prefixLabel: forumPrefixes.label, prefixSlug: forumPrefixes.slug, prefixColor: forumPrefixes.color,
        authorHandle: users.handle, authorName: users.displayName,
        lastPosterHandle: lp.handle, lastPosterName: lp.displayName,
      })
      .from(forumTopics)
      .innerJoin(users, eq(users.id, forumTopics.authorId))
      .leftJoin(lp, eq(lp.id, forumTopics.lastPosterId))
      .leftJoin(forumPrefixes, eq(forumPrefixes.id, forumTopics.prefixId))
      .where(and(...conds))
      .orderBy(desc(forumTopics.pinned), desc(forumTopics.lastPostAt))
      .limit(TOPICS_PER_PAGE + 1)
      .offset((p - 1) * TOPICS_PER_PAGE);
    const hasMore = rows.length > TOPICS_PER_PAGE;
    const items = rows.slice(0, TOPICS_PER_PAGE);
    // Tags de cada tópico, em lote.
    const ids = items.map((r) => r.id);
    const byTopic = new Map<number, TopicTag[]>();
    if (ids.length) {
      const tagRows = await db
        .select({ topicId: forumTopicTags.topicId, name: forumTags.name, slug: forumTags.slug })
        .from(forumTopicTags)
        .innerJoin(forumTags, eq(forumTags.id, forumTopicTags.tagId))
        .where(inArray(forumTopicTags.topicId, ids));
      for (const tr of tagRows) {
        const arr = byTopic.get(tr.topicId) ?? [];
        arr.push({ name: tr.name, slug: tr.slug });
        byTopic.set(tr.topicId, arr);
      }
    }
    return {
      items: items.map(({ prefixLabel, prefixSlug: pslug, prefixColor, ...r }) => ({
        ...r,
        prefix: prefixLabel && pslug && prefixColor ? { label: prefixLabel, slug: pslug, color: prefixColor } : null,
        tags: byTopic.get(r.id) ?? [],
      })),
      hasMore,
    };
  } catch {
    return { items: [], hasMore: false };
  }
}

/** Resolve nomes de tags para ids (criando as que faltam). Normaliza e limita. */
export async function resolveTags(rawNames: string[]): Promise<{ id: number; name: string; slug: string }[]> {
  const seen = new Set<string>();
  const wanted: { name: string; slug: string }[] = [];
  for (const raw of rawNames) {
    const name = String(raw).trim().replace(/\s+/g, " ").slice(0, 40);
    const slug = slugify(name).slice(0, 60);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    wanted.push({ name, slug });
    if (wanted.length >= 6) break;
  }
  if (!wanted.length) return [];
  const slugs = wanted.map((w) => w.slug);
  const existing = await db.select({ id: forumTags.id, name: forumTags.name, slug: forumTags.slug }).from(forumTags).where(inArray(forumTags.slug, slugs));
  const bySlug = new Map(existing.map((t) => [t.slug, { id: t.id, name: t.name, slug: t.slug }]));
  for (const w of wanted) {
    if (bySlug.has(w.slug)) continue;
    try {
      const ins = await db.insert(forumTags).values({ name: w.name, slug: w.slug });
      const id = (ins as unknown as [{ insertId: number }])[0].insertId;
      bySlug.set(w.slug, { id, name: w.name, slug: w.slug });
    } catch {
      // corrida: outro inseriu — relê
      const [t] = await db.select({ id: forumTags.id, name: forumTags.name, slug: forumTags.slug }).from(forumTags).where(eq(forumTags.slug, w.slug)).limit(1);
      if (t) bySlug.set(w.slug, { id: t.id, name: t.name, slug: t.slug });
    }
  }
  return wanted.map((w) => bySlug.get(w.slug)).filter((t): t is { id: number; name: string; slug: string } => !!t);
}

/** Tags de um tópico (para a página do tópico). */
export async function getTopicTags(topicId: number): Promise<TopicTag[]> {
  try {
    return await db
      .select({ name: forumTags.name, slug: forumTags.slug })
      .from(forumTopicTags)
      .innerJoin(forumTags, eq(forumTags.id, forumTopicTags.tagId))
      .where(eq(forumTopicTags.topicId, topicId));
  } catch {
    return [];
  }
}

// ── Tópico + posts ─────────────────────────────────────────────────────────
export type TopicWithForum = {
  id: number; title: string; slug: string; status: string; pinned: boolean; isQuestion: boolean; bestPostId: number | null;
  views: number; postsCount: number; authorId: number; createdAt: Date; prefix: TopicPrefix | null;
  forumId: number; forumSlug: string; forumTitle: string; forumLocked: boolean;
  forumMinReadRole: UserRole; forumMinPostRole: UserRole; forumVisible: boolean;
};
export async function getTopicBySlug(slug: string): Promise<TopicWithForum | null> {
  try {
    const [r] = await db
      .select({
        id: forumTopics.id, title: forumTopics.title, slug: forumTopics.slug, status: forumTopics.status,
        pinned: forumTopics.pinned, isQuestion: forumTopics.isQuestion, bestPostId: forumTopics.bestPostId,
        views: forumTopics.views, postsCount: forumTopics.postsCount, authorId: forumTopics.authorId,
        createdAt: forumTopics.createdAt, deletedAt: forumTopics.deletedAt,
        prefixLabel: forumPrefixes.label, prefixSlug: forumPrefixes.slug, prefixColor: forumPrefixes.color,
        forumId: forums.id, forumSlug: forums.slug, forumTitle: forums.title, forumLocked: forums.locked,
        forumMinReadRole: forums.minReadRole, forumMinPostRole: forums.minPostRole, forumVisible: forums.visible,
      })
      .from(forumTopics)
      .innerJoin(forums, eq(forums.id, forumTopics.forumId))
      .leftJoin(forumPrefixes, eq(forumPrefixes.id, forumTopics.prefixId))
      .where(eq(forumTopics.slug, slug))
      .limit(1);
    if (!r || r.deletedAt) return null;
    const { prefixLabel, prefixSlug, prefixColor, ...rest } = r;
    return { ...rest, prefix: prefixLabel && prefixSlug && prefixColor ? { label: prefixLabel, slug: prefixSlug, color: prefixColor } : null };
  } catch {
    return null;
  }
}

export type ForumPostItem = {
  id: number; body: string; status: string; isFirst: boolean; createdAt: Date; editedAt: Date | null;
  authorId: number; authorHandle: string; authorName: string; authorAvatar: string | null; authorRole: UserRole;
  authorReputation: number; authorPostCount: number; authorJoinedAt: Date;
};
export async function listPosts(topicId: number, page: number): Promise<{ items: ForumPostItem[]; hasMore: boolean }> {
  const p = Math.max(1, page);
  try {
    const rows = await db
      .select({
        id: forumPosts.id, body: forumPosts.body, status: forumPosts.status, isFirst: forumPosts.isFirst,
        createdAt: forumPosts.createdAt, editedAt: forumPosts.editedAt,
        authorId: users.id, authorHandle: users.handle, authorName: users.displayName, authorAvatar: users.avatarUrl,
        authorRole: users.role, authorReputation: users.reputation, authorJoinedAt: users.createdAt,
      })
      .from(forumPosts)
      .innerJoin(users, eq(users.id, forumPosts.authorId))
      .where(and(eq(forumPosts.topicId, topicId), eq(forumPosts.status, "visible"), isNull(forumPosts.deletedAt)))
      .orderBy(asc(forumPosts.createdAt))
      .limit(POSTS_PER_PAGE + 1)
      .offset((p - 1) * POSTS_PER_PAGE);
    const hasMore = rows.length > POSTS_PER_PAGE;
    const items = rows.slice(0, POSTS_PER_PAGE);
    // Contagem total de posts por autor (postbit), numa query só.
    const authorIds = [...new Set(items.map((r) => r.authorId))];
    const counts = new Map<number, number>();
    if (authorIds.length) {
      const cRows = await db
        .select({ authorId: forumPosts.authorId, n: sql<number>`COUNT(*)` })
        .from(forumPosts)
        .where(and(inArray(forumPosts.authorId, authorIds), eq(forumPosts.status, "visible"), isNull(forumPosts.deletedAt)))
        .groupBy(forumPosts.authorId);
      for (const c of cRows) counts.set(c.authorId, Number(c.n));
    }
    return {
      items: items.map((r) => ({ ...r, authorPostCount: counts.get(r.authorId) ?? 0 })),
      hasMore,
    };
  } catch {
    return { items: [], hasMore: false };
  }
}

/** Incrementa a contagem de visualizações (best-effort, não bloqueia render). */
export async function incrementTopicView(topicId: number): Promise<void> {
  try {
    await db.update(forumTopics).set({ views: sql`${forumTopics.views} + 1` }).where(eq(forumTopics.id, topicId));
  } catch {
    // ignora
  }
}

/** Está seguindo o tópico? (null user → false) */
export async function isFollowingTopic(topicId: number, userId: number | null): Promise<boolean> {
  if (!userId) return false;
  try {
    const [r] = await db.select({ id: forumTopicFollows.id }).from(forumTopicFollows)
      .where(and(eq(forumTopicFollows.topicId, topicId), eq(forumTopicFollows.userId, userId))).limit(1);
    return !!r;
  } catch {
    return false;
  }
}
