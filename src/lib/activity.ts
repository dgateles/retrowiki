import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { articles, comments, userBadges, badges } from "@/db/schema";

export type ActivityItem =
  | { kind: "guide"; date: Date; title: string; slug: string }
  | { kind: "comment"; date: Date; articleTitle: string; articleSlug: string; commentId: number }
  | { kind: "badge"; date: Date; name: string; icon: string };

/** Feed de atividade pública do membro: guias publicados, comentários e badges,
 * mesclados e ordenados por data. */
export async function getUserActivity(userId: number, limit = 20): Promise<ActivityItem[]> {
  try {
    const [guides, cms, earned] = await Promise.all([
      db
        .select({ title: articles.title, slug: articles.slug, date: articles.publishedAt })
        .from(articles)
        .where(and(eq(articles.authorId, userId), eq(articles.status, "published")))
        .orderBy(desc(articles.publishedAt))
        .limit(limit),
      db
        .select({ id: comments.id, articleId: comments.articleId, date: comments.createdAt })
        .from(comments)
        .where(and(eq(comments.authorId, userId), eq(comments.status, "visible")))
        .orderBy(desc(comments.createdAt))
        .limit(limit),
      db
        .select({ name: badges.name, icon: badges.icon, date: userBadges.awardedAt })
        .from(userBadges)
        .innerJoin(badges, eq(badges.id, userBadges.badgeId))
        .where(eq(userBadges.userId, userId))
        .orderBy(desc(userBadges.awardedAt))
        .limit(limit),
    ]);

    // Títulos/slugs dos artigos comentados.
    const artIds = [...new Set(cms.map((c) => c.articleId))];
    const artMap = new Map<number, { title: string; slug: string }>();
    if (artIds.length) {
      const arts = await db.select({ id: articles.id, title: articles.title, slug: articles.slug }).from(articles).where(inArray(articles.id, artIds));
      for (const a of arts) artMap.set(a.id, { title: a.title, slug: a.slug });
    }

    const items: ActivityItem[] = [];
    for (const g of guides) if (g.date) items.push({ kind: "guide", date: g.date, title: g.title, slug: g.slug });
    for (const c of cms) {
      const a = artMap.get(c.articleId);
      if (a) items.push({ kind: "comment", date: c.date, articleTitle: a.title, articleSlug: a.slug, commentId: c.id });
    }
    for (const b of earned) items.push({ kind: "badge", date: b.date, name: b.name, icon: b.icon });

    items.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());
    return items.slice(0, limit);
  } catch {
    return [];
  }
}
