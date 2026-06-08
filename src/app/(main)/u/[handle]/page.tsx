import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";
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

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await getProfile(handle);
  if (!profile) notFound();

  const rank = rankForReputation(profile.reputation);

  return (
    <main id="main" className="page">
      <header className="profile__head">
        <span className="profile__avatar" aria-hidden="true">
          <UserRound className="size-8" />
        </span>
        <div>
          <h1 className="profile__name">{profile.displayName}</h1>
          <p className="profile__meta">
            @{profile.handle} · {roleLabel(profile.role)} ·{" "}
            <span title="Reputação">{profile.reputation} pts</span>
          </p>
          <p className="profile__since">
            Na comunidade desde{" "}
            <time dateTime={new Date(profile.createdAt).toISOString()}>
              {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(profile.createdAt))}
            </time>
          </p>
        </div>
      </header>

      <section aria-label="Rank" className="rank mt-6">
        <div className="rank__head">
          <span className="rank__label">{rank.label}</span>
          <span className="rank__index">Rank {rank.index} de {rank.total}</span>
        </div>
        <div className="rank__bar">
          <div className="rank__fill" style={{ width: `${Math.round(rank.progress * 100)}%` }} />
        </div>
        <p className="rank__next">
          {rank.next === null
            ? "Rank máximo alcançado."
            : `${rank.pointsToNext} ${rank.pointsToNext === 1 ? "ponto" : "pontos"} até o próximo rank.`}
        </p>
      </section>

      <section aria-labelledby="contrib" className="comments">
        <h2 id="contrib" className="comments__title">
          Publicações ({profile.articles.length})
        </h2>
        {profile.articles.length === 0 ? (
          <p className="empty__text">Nenhuma publicação ainda.</p>
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
    </main>
  );
}
