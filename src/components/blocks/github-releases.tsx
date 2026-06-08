import { Download } from "lucide-react";
import { getReleases } from "@/lib/integrations/github";

export async function GithubReleasesBlock({
  owner,
  repo,
  limit = 3,
}: {
  owner: string;
  repo: string;
  limit?: number;
}) {
  const releases = await getReleases(owner, repo, limit);

  if (releases.length === 0) {
    return (
      <p role="status" className="my-4 text-sm text-muted-foreground">
        Releases de <code className="font-mono">{owner}/{repo}</code> indisponíveis no momento.
      </p>
    );
  }

  return (
    <section aria-label={`Últimos releases de ${owner}/${repo}`} className="my-6 space-y-3">
      {releases.map((r) => (
        <article key={r.tag_name} className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold">{r.name || r.tag_name}</h3>
          <p className="text-sm text-muted-foreground">
            <time dateTime={r.published_at}>
              {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(r.published_at))}
            </time>
          </p>
          <ul className="mt-2 space-y-1">
            {r.assets.slice(0, 4).map((a) => (
              <li key={a.name}>
                <a
                  href={a.browser_download_url}
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline focus-visible:outline-2"
                >
                  <Download className="size-4" aria-hidden="true" />
                  {a.name}
                  <span className="text-muted-foreground">({(a.size / 1e6).toFixed(0)} MB)</span>
                </a>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
