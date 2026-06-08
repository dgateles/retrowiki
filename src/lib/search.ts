import "server-only";
import { and, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { articles, devices, users } from "@/db/schema";

export type SearchResults = {
  devices: { slug: string; name: string; manufacturer: string }[];
  articles: { slug: string; title: string; summary: string | null; authorHandle: string }[];
};

export async function searchAll(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (q.length < 2) return { devices: [], articles: [] };
  const term = `%${q.replace(/[%_]/g, "\\$&")}%`;

  try {
    const [dev, art] = await Promise.all([
      db
        .select({ slug: devices.slug, name: devices.name, manufacturer: devices.manufacturer })
        .from(devices)
        .where(and(eq(devices.status, "published"), or(like(devices.name, term), like(devices.manufacturer, term))))
        .limit(10),
      db
        .select({
          slug: articles.slug,
          title: articles.title,
          summary: articles.summary,
          authorHandle: users.handle,
        })
        .from(articles)
        .innerJoin(users, eq(users.id, articles.authorId))
        .where(
          and(
            eq(articles.status, "published"),
            or(like(articles.title, term), like(articles.summary, term), like(articles.searchText, term)),
          ),
        )
        .limit(20),
    ]);
    return { devices: dev, articles: art };
  } catch {
    return { devices: [], articles: [] };
  }
}
