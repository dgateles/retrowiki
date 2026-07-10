import "server-only";
import { and, eq, inArray, isNull, like, or, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { articles, devices, users, forumTopics, forums } from "@/db/schema";

export type SearchScope = "tudo" | "consoles" | "guias" | "forum";

export type SearchResults = {
  devices: { slug: string; name: string; manufacturer: string }[];
  articles: { slug: string; title: string; summary: string | null; kind: "guide" | "blog"; authorHandle: string }[];
  forumTopics: { slug: string; forumSlug: string; title: string }[];
};

const EMPTY: SearchResults = { devices: [], articles: [], forumTopics: [] };

async function searchForumTopicsLike(term: string): Promise<SearchResults["forumTopics"]> {
  return db
    .select({ slug: forumTopics.slug, forumSlug: forums.slug, title: forumTopics.title })
    .from(forumTopics)
    .innerJoin(forums, eq(forums.id, forumTopics.forumId))
    .where(and(
      like(forumTopics.title, term),
      eq(forums.visible, true), eq(forums.minReadRole, "member"),
      inArray(forumTopics.status, ["open", "locked", "archived"]), isNull(forumTopics.deletedAt),
    ))
    .limit(10);
}

const MAX_QUERY_LENGTH = 100;

/** Monta a expressão boolean do FULLTEXT: cada token vira "+token*" (exigido +
 * prefixo). Remove os operadores boolean do MySQL para evitar erro de sintaxe. */
function booleanQuery(q: string): string {
  return q
    .split(/\s+/)
    .map((t) => t.replace(/[+\-><()~*"@]/g, "").trim())
    .filter((t) => t.length > 0)
    .map((t) => `+${t}*`)
    .join(" ");
}

async function searchDevicesLike(term: string) {
  return db
    .select({ slug: devices.slug, name: devices.name, manufacturer: devices.manufacturer })
    .from(devices)
    .where(and(eq(devices.status, "published"), or(like(devices.name, term), like(devices.manufacturer, term))))
    .limit(10);
}

async function searchArticlesLike(term: string) {
  return db
    .select({ slug: articles.slug, title: articles.title, summary: articles.summary, kind: articles.kind, authorHandle: users.handle })
    .from(articles)
    .innerJoin(users, eq(users.id, articles.authorId))
    .where(and(eq(articles.status, "published"), or(like(articles.title, term), like(articles.summary, term), like(articles.searchText, term))))
    .limit(20);
}

export async function searchAll(query: string, scope: SearchScope = "tudo"): Promise<SearchResults> {
  const q = query.trim().slice(0, MAX_QUERY_LENGTH);
  if (q.length < 2) return EMPTY;
  const term = `%${q.replace(/[%_]/g, "\\$&")}%`;
  const boolean = booleanQuery(q);
  const wantDevices = scope === "tudo" || scope === "consoles";
  const wantArticles = scope === "tudo" || scope === "guias";
  const wantForum = scope === "tudo" || scope === "forum";

  try {
    const devMatch = sql`MATCH(${devices.name}, ${devices.manufacturer}) AGAINST(${boolean} IN BOOLEAN MODE)`;
    const artMatch = sql`MATCH(${articles.title}, ${articles.summary}, ${articles.searchText}) AGAINST(${boolean} IN BOOLEAN MODE)`;

    let [dev, art] = await Promise.all([
      wantDevices && boolean
        ? db
            .select({ slug: devices.slug, name: devices.name, manufacturer: devices.manufacturer })
            .from(devices)
            .where(and(eq(devices.status, "published"), devMatch))
            .orderBy(desc(devMatch))
            .limit(10)
        : Promise.resolve([] as SearchResults["devices"]),
      wantArticles && boolean
        ? db
            .select({ slug: articles.slug, title: articles.title, summary: articles.summary, kind: articles.kind, authorHandle: users.handle })
            .from(articles)
            .innerJoin(users, eq(users.id, articles.authorId))
            .where(and(eq(articles.status, "published"), artMatch))
            .orderBy(desc(artMatch))
            .limit(20)
        : Promise.resolve([] as SearchResults["articles"]),
    ]);

    // Fallback p/ LIKE quando o FULLTEXT não retorna (consultas curtas, stopwords,
    // termos abaixo do innodb_ft_min_token_size).
    if (wantDevices && dev.length === 0) dev = await searchDevicesLike(term);
    if (wantArticles && art.length === 0) art = await searchArticlesLike(term);
    // Tópicos de fórum: só LIKE (sem índice FULLTEXT), sempre no escopo tudo/forum.
    const forumTopicsRes = wantForum ? await searchForumTopicsLike(term) : [];

    return { devices: dev, articles: art, forumTopics: forumTopicsRes };
  } catch {
    // Em qualquer erro (ex.: índice ausente), cai para LIKE.
    try {
      const [dev, art, ftopics] = await Promise.all([
        wantDevices ? searchDevicesLike(term) : Promise.resolve([] as SearchResults["devices"]),
        wantArticles ? searchArticlesLike(term) : Promise.resolve([] as SearchResults["articles"]),
        wantForum ? searchForumTopicsLike(term) : Promise.resolve([] as SearchResults["forumTopics"]),
      ]);
      return { devices: dev, articles: art, forumTopics: ftopics };
    } catch {
      return EMPTY;
    }
  }
}
