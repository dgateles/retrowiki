import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { githubRepos } from "@/db/schema";
import { getReleases } from "@/lib/integrations/github";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  if (!env.CRON_SECRET) return false;
  const got = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Atualiza o cache de releases de cada repo da allowlist (materializado em
 * github_repos.cache, usado como fallback). Mantém os blocos github-releases
 * frescos mesmo em repos sem tráfego recente. As próprias páginas revalidam por
 * tempo (revalidate: 3600). Protegido por CRON_SECRET (Authorization: Bearer).
 */
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const repos = await db.select().from(githubRepos);
  let synced = 0;
  for (const { owner, repo } of repos) {
    await getReleases(owner, repo).catch(() => {});
    synced++;
  }
  return NextResponse.json({ ok: true, synced });
}
