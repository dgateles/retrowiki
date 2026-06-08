import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { githubRepos } from "@/db/schema";
import { env } from "@/lib/env";

const Release = z.object({
  tag_name: z.string(),
  name: z.string().nullable(),
  html_url: z.string().url(),
  published_at: z.string(),
  prerelease: z.boolean(),
  assets: z.array(
    z.object({
      name: z.string(),
      browser_download_url: z.string().url(),
      size: z.number(),
    }),
  ),
});
export type Release = z.infer<typeof Release>;

/**
 * Releases de um repositório da allowlist (tabela github_repos). Fetch
 * server-side com cache/revalidate e fallback ao último payload salvo. Anti-SSRF:
 * o cliente nunca escolhe a URL, só um par owner/repo previamente aprovado.
 */
export async function getReleases(
  owner: string,
  repo: string,
  limit = 3,
): Promise<Release[]> {
  const [allowed] = await db
    .select()
    .from(githubRepos)
    .where(and(eq(githubRepos.owner, owner), eq(githubRepos.repo, repo)))
    .limit(1);
  if (!allowed) return [];

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases?per_page=${limit}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 3600, tags: [`gh:${owner}/${repo}`] },
      },
    );
    if (!res.ok) return (allowed.cache as Release[] | null) ?? [];

    const parsed = z.array(Release).safeParse(await res.json());
    const releases = parsed.success ? parsed.data.slice(0, limit) : [];

    await db
      .update(githubRepos)
      .set({ lastSynced: new Date(), cache: releases as object })
      .where(eq(githubRepos.id, allowed.id))
      .catch(() => {});
    return releases;
  } catch {
    return (allowed.cache as Release[] | null) ?? [];
  }
}
