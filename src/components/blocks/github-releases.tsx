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
      <p role="status" className="blk-p">
        Releases de <code>{owner}/{repo}</code> indisponíveis no momento.
      </p>
    );
  }

  return (
    <section aria-label={`Últimos releases de ${owner}/${repo}`} className="releases">
      {releases.map((r) => (
        <article key={r.tag_name} className="release">
          <h3 className="release__title">{r.name || r.tag_name}</h3>
          <p className="release__date">
            <time dateTime={r.published_at}>
              {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(r.published_at))}
            </time>
          </p>
          <ul className="release__assets">
            {r.assets.slice(0, 4).map((a) => (
              <li key={a.name}>
                <a href={a.browser_download_url} rel="nofollow noopener noreferrer" className="release__asset">
                  <Download className="size-4" aria-hidden="true" />
                  {a.name}
                  <span className="release__size">({(a.size / 1e6).toFixed(0)} MB)</span>
                </a>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
