import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profiles";
import { typeLabel } from "@/lib/articles";
import { rankForReputation, roleLabel } from "@/lib/ranks";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfile(handle);
  if (!profile) return {};
  return { title: `@${profile.handle}`, description: `Perfil de ${profile.displayName} na RetroWiki.` };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await getProfile(handle);
  if (!profile) notFound();

  const rank = rankForReputation(profile.reputation);
  const joined = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(profile.createdAt),
  );

  return (
    <main id="main" className="page">
      <div className="profile-cover" aria-hidden="true" />

      <header className="profile-id">
        <span className="profile-id__avatar" aria-hidden="true">{initials(profile.displayName)}</span>
        <div className="profile-id__body">
          <div>
            <h1 className="profile-id__name">{profile.displayName}</h1>
            <p className="profile-id__role">@{profile.handle} · {roleLabel(profile.role)}</p>
            <p className="profile-id__meta">Na comunidade desde {joined}</p>
          </div>
        </div>
      </header>

      <div className="profile-grid">
        <aside className="profile-side">
          <section aria-label="Rank" className="rank">
            <div className="rank__head">
              <span className="rank__label">{rank.label}</span>
              <span className="rank__index">Rank {rank.index} de {rank.total}</span>
            </div>
            <progress
              className="rank__progress"
              value={Math.round(rank.progress * 100)}
              max={100}
              aria-label={`Progresso no rank ${rank.label}`}
            />
            <p className="rank__next">
              {rank.next === null
                ? "Rank máximo alcançado."
                : `${rank.pointsToNext} ${rank.pointsToNext === 1 ? "ponto" : "pontos"} até o próximo rank.`}
            </p>
          </section>

          <dl className="profile-stats">
            <div className="profile-stat">
              <dt className="profile-stat__label">Publicações</dt>
              <dd className="profile-stat__value">{profile.articles.length}</dd>
            </div>
            <div className="profile-stat">
              <dt className="profile-stat__label">Reputação</dt>
              <dd className="profile-stat__value profile-stat__value--accent">{profile.reputation}</dd>
            </div>
            <div className="profile-stat">
              <dt className="profile-stat__label">Papel</dt>
              <dd className="profile-stat__value">{roleLabel(profile.role)}</dd>
            </div>
          </dl>
        </aside>

        <section aria-labelledby="contrib">
          <h2 id="contrib" className="comments__title">
            Publicações ({profile.articles.length})
          </h2>
          {profile.articles.length === 0 ? (
            <p className="empty mt-4">Nenhuma publicação ainda.</p>
          ) : (
            <ul className="link-list">
              {profile.articles.map((a) => (
                <li key={a.id}>
                  <Link href={`/guias/${a.slug}`} className="link-card">
                    <span className="link-card__title">{a.title}</span>
                    <span className="link-card__meta">{typeLabel(a.type)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
