import "server-only";
import { eq, and, count, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { badges, userBadges, articles, comments, users } from "@/db/schema";
import { slugify } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

type Tier = "bronze" | "silver" | "gold";
type Stats = { guides: number; comments: number; reputation: number };

type BadgeDef = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  tier: Tier;
  sortOrder: number;
  earned: (s: Stats) => boolean;
};

// Catálogo de conquistas, dirigido por código. Idempotente no banco.
const CATALOG: BadgeDef[] = [
  { slug: "first_guide", name: "Primeiro guia", description: "Publicou seu primeiro guia.", icon: "BookOpen", tier: "bronze", sortOrder: 1, earned: (s) => s.guides >= 1 },
  { slug: "author_5", name: "Autor", description: "Publicou cinco guias.", icon: "PenLine", tier: "silver", sortOrder: 2, earned: (s) => s.guides >= 5 },
  { slug: "curator_20", name: "Curador", description: "Publicou vinte guias.", icon: "Library", tier: "gold", sortOrder: 3, earned: (s) => s.guides >= 20 },
  { slug: "first_comment", name: "Primeira voz", description: "Fez seu primeiro comentário.", icon: "MessageCircle", tier: "bronze", sortOrder: 4, earned: (s) => s.comments >= 1 },
  { slug: "active_25", name: "Participativo", description: "Fez vinte e cinco comentários.", icon: "MessagesSquare", tier: "silver", sortOrder: 5, earned: (s) => s.comments >= 25 },
  { slug: "rep_100", name: "Reconhecido", description: "Alcançou cem de reputação.", icon: "Star", tier: "silver", sortOrder: 6, earned: (s) => s.reputation >= 100 },
  { slug: "rep_1000", name: "Referência", description: "Alcançou mil de reputação.", icon: "Trophy", tier: "gold", sortOrder: 7, earned: (s) => s.reputation >= 1000 },
];

const ICONS = new Map(CATALOG.map((d) => [d.slug, d.icon]));

/** Semeia o catálogo padrão apenas se a tabela estiver vazia, para que as
 * edições e exclusões do admin persistam. */
async function ensureCatalog(): Promise<void> {
  const [row] = await db.select({ n: count() }).from(badges);
  if ((row?.n ?? 0) > 0) return;
  await db
    .insert(badges)
    .values(CATALOG.map((d) => ({ slug: d.slug, name: d.name, description: d.description, icon: d.icon, tier: d.tier, sortOrder: d.sortOrder })));
}

async function statsFor(userId: number): Promise<Stats> {
  const [g] = await db.select({ n: count() }).from(articles).where(and(eq(articles.authorId, userId), eq(articles.status, "published")));
  const [c] = await db.select({ n: count() }).from(comments).where(and(eq(comments.authorId, userId), eq(comments.status, "visible")));
  const [u] = await db.select({ reputation: users.reputation }).from(users).where(eq(users.id, userId)).limit(1);
  return { guides: g?.n ?? 0, comments: c?.n ?? 0, reputation: u?.reputation ?? 0 };
}

/**
 * Concede ao usuário as badges que ele já merece e ainda não tem.
 * Idempotente. Retorna os slugs recém-concedidos.
 */
export async function evaluateBadges(userId: number): Promise<string[]> {
  try {
    await ensureCatalog();
    const stats = await statsFor(userId);
    const earnedSlugs = CATALOG.filter((d) => d.earned(stats)).map((d) => d.slug);
    if (earnedSlugs.length === 0) return [];

    const rows = await db.select({ id: badges.id, slug: badges.slug, name: badges.name }).from(badges).where(inArray(badges.slug, earnedSlugs));
    const idBySlug = new Map(rows.map((r) => [r.slug, r.id]));
    const nameBySlug = new Map(rows.map((r) => [r.slug, r.name]));

    const owned = await db.select({ badgeId: userBadges.badgeId }).from(userBadges).where(eq(userBadges.userId, userId));
    const ownedIds = new Set(owned.map((o) => o.badgeId));

    const toAward = earnedSlugs
      .map((slug) => ({ slug, id: idBySlug.get(slug) }))
      .filter((x): x is { slug: string; id: number } => x.id !== undefined && !ownedIds.has(x.id));

    if (toAward.length === 0) return [];
    await db.insert(userBadges).values(toAward.map((x) => ({ userId, badgeId: x.id }))).onDuplicateKeyUpdate({ set: { badgeId: sql`badge_id` } });
    for (const x of toAward) await createNotification(userId, "badge.earned", { name: nameBySlug.get(x.slug) });
    return toAward.map((x) => x.slug);
  } catch {
    return [];
  }
}

export type UserBadge = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  tier: Tier;
};

export async function getUserBadges(userId: number): Promise<UserBadge[]> {
  try {
    return await db
      .select({ slug: badges.slug, name: badges.name, description: badges.description, icon: badges.icon, tier: badges.tier })
      .from(userBadges)
      .innerJoin(badges, eq(badges.id, userBadges.badgeId))
      .where(eq(userBadges.userId, userId))
      .orderBy(badges.sortOrder);
  } catch {
    return [];
  }
}

export function badgeIcon(slug: string): string {
  return ICONS.get(slug) ?? "Award";
}

// ── Admin (gamificação) ──────────────────────────────────────────────────

export type BadgeWithCount = {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  image: string | null;
  tier: Tier;
  manuallyAwardable: boolean;
  count: number;
};

/** Catálogo de badges com quantos usuários já conquistaram cada uma. */
export async function listBadgesWithCounts(): Promise<BadgeWithCount[]> {
  try {
    await ensureCatalog();
    const rows = await db
      .select({
        id: badges.id,
        slug: badges.slug,
        name: badges.name,
        description: badges.description,
        icon: badges.icon,
        image: badges.image,
        tier: badges.tier,
        manuallyAwardable: badges.manuallyAwardable,
        count: count(userBadges.id),
      })
      .from(badges)
      .leftJoin(userBadges, eq(userBadges.badgeId, badges.id))
      .groupBy(badges.id, badges.slug, badges.name, badges.description, badges.icon, badges.image, badges.tier, badges.manuallyAwardable, badges.sortOrder)
      .orderBy(badges.sortOrder);
    return rows.map((r) => ({ ...r, count: Number(r.count) }));
  } catch {
    return [];
  }
}

// ── CRUD de badges (admin) ──────────────────────────────────────────────

export type BadgeRow = { id: number; slug: string; name: string; description: string; icon: string; image: string | null; tier: Tier; manuallyAwardable: boolean; sortOrder: number };

export async function getBadge(id: number): Promise<BadgeRow | null> {
  try {
    const [b] = await db.select().from(badges).where(eq(badges.id, id)).limit(1);
    return b ? { ...b, tier: b.tier as Tier } : null;
  } catch {
    return null;
  }
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base).slice(0, 60) || "badge";
  let slug = root;
  for (let i = 2; i < 100; i++) {
    const [hit] = await db.select({ id: badges.id }).from(badges).where(eq(badges.slug, slug)).limit(1);
    if (!hit) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${root.length}`;
}

type BadgeInput = { name: string; description: string; icon: string; image: string | null; tier: Tier; manuallyAwardable: boolean };

export async function createBadge(input: BadgeInput): Promise<number | null> {
  try {
    await ensureCatalog();
    const slug = await uniqueSlug(input.name);
    const [maxRow] = await db.select({ m: sql<number>`COALESCE(MAX(${badges.sortOrder}), 0)` }).from(badges);
    const sortOrder = Number(maxRow?.m ?? 0) + 1;
    const [res] = await db.insert(badges).values({ slug, name: input.name, description: input.description, icon: input.icon, image: input.image, tier: input.tier, manuallyAwardable: input.manuallyAwardable, sortOrder });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function updateBadge(id: number, input: BadgeInput): Promise<boolean> {
  try {
    await db.update(badges).set({ name: input.name, description: input.description, icon: input.icon, image: input.image, tier: input.tier, manuallyAwardable: input.manuallyAwardable }).where(eq(badges.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deleteBadge(id: number): Promise<boolean> {
  try {
    await db.delete(userBadges).where(eq(userBadges.badgeId, id));
    await db.delete(badges).where(eq(badges.id, id));
    return true;
  } catch {
    return false;
  }
}

/** Concede manualmente uma badge a um usuário. Idempotente. Notifica se for nova. */
export async function awardBadgeBySlug(userId: number, slug: string): Promise<boolean> {
  try {
    await ensureCatalog();
    const [b] = await db.select({ id: badges.id, name: badges.name }).from(badges).where(eq(badges.slug, slug)).limit(1);
    if (!b) return false;
    const [owned] = await db.select({ id: userBadges.id }).from(userBadges).where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, b.id))).limit(1);
    await db.insert(userBadges).values({ userId, badgeId: b.id }).onDuplicateKeyUpdate({ set: { badgeId: sql`badge_id` } });
    if (!owned) await createNotification(userId, "badge.earned", { name: b.name });
    return true;
  } catch {
    return false;
  }
}

/** Remove uma badge de um usuário. */
export async function revokeBadgeBySlug(userId: number, slug: string): Promise<boolean> {
  try {
    const [b] = await db.select({ id: badges.id }).from(badges).where(eq(badges.slug, slug)).limit(1);
    if (!b) return false;
    await db.delete(userBadges).where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, b.id)));
    return true;
  } catch {
    return false;
  }
}

/** Recalcula as conquistas automáticas de todos os usuários. Retorna quantos
 * usuários receberam pelo menos uma badge nova. */
export async function recalcAllBadges(): Promise<{ users: number; awarded: number }> {
  let usersChanged = 0;
  let awarded = 0;
  try {
    const all = await db.select({ id: users.id }).from(users);
    for (const u of all) {
      const got = await evaluateBadges(u.id);
      if (got.length) {
        usersChanged += 1;
        awarded += got.length;
      }
    }
  } catch {
    // ignora falhas pontuais
  }
  return { users: usersChanged, awarded };
}
