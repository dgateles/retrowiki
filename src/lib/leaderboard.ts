import "server-only";
import { and, desc, eq, gte, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { votes, articles, users } from "@/db/schema";
import { getReputationSettings } from "@/lib/settings";

export type LeaderMember = { id: number; handle: string; displayName: string; avatarUrl: string | null; reputation: number; gained?: number };
export type LeaderContent = { id: number; slug: string; title: string; reactions: number };

/** Instante UTC da meia-noite de hoje no fuso informado. */
function startOfTodayInTz(tz: string): Date {
  const now = new Date();
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(now);
  }
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offset = wall - now.getTime();
  const midnightWall = Date.UTC(get("year"), get("month") - 1, get("day"), 0, 0, 0);
  return new Date(midnightWall - offset);
}

export type LeaderboardData = {
  enabled: boolean;
  todayMembers: LeaderMember[];
  todayContent: LeaderContent[];
  topMembers: LeaderMember[];
};

export async function getLeaderboardData(limit = 10): Promise<LeaderboardData> {
  const settings = await getReputationSettings();
  if (!settings.leaderboardEnabled) {
    return { enabled: false, todayMembers: [], todayContent: [], topMembers: [] };
  }
  const excluded = settings.leaderboardExcludeRoles as Array<"member" | "contributor" | "moderator" | "admin">;
  const since = startOfTodayInTz(settings.leaderboardTimezone);

  try {
    // Top membros por reputação recebida hoje (soma dos pesos das reações no conteúdo deles).
    const todayMembers = await db
      .select({
        id: users.id,
        handle: users.handle,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        reputation: users.reputation,
        gained: sql<number>`SUM(${votes.value})`,
      })
      .from(votes)
      .innerJoin(articles, eq(articles.id, votes.articleId))
      .innerJoin(users, eq(users.id, articles.authorId))
      .where(and(gte(votes.createdAt, since), excluded.length ? notInArray(users.role, excluded) : undefined))
      .groupBy(users.id, users.handle, users.displayName, users.avatarUrl, users.reputation)
      .orderBy(desc(sql`SUM(${votes.value})`))
      .limit(limit);

    // Top conteúdo por número de reações hoje.
    const todayContent = await db
      .select({ id: articles.id, slug: articles.slug, title: articles.title, reactions: sql<number>`COUNT(*)` })
      .from(votes)
      .innerJoin(articles, eq(articles.id, votes.articleId))
      .where(gte(votes.createdAt, since))
      .groupBy(articles.id, articles.slug, articles.title)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(limit);

    // Top membros por reputação total.
    const topMembers = await db
      .select({ id: users.id, handle: users.handle, displayName: users.displayName, avatarUrl: users.avatarUrl, reputation: users.reputation })
      .from(users)
      .where(excluded.length ? notInArray(users.role, excluded) : undefined)
      .orderBy(desc(users.reputation))
      .limit(limit);

    return {
      enabled: true,
      todayMembers: todayMembers.map((m) => ({ ...m, gained: Number(m.gained) })),
      todayContent: todayContent.map((c) => ({ ...c, reactions: Number(c.reactions) })),
      topMembers,
    };
  } catch {
    return { enabled: true, todayMembers: [], todayContent: [], topMembers: [] };
  }
}
