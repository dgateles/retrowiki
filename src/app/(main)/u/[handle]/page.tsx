import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";
import { getProfile } from "@/lib/profiles";
import { typeLabel } from "@/lib/articles";

const ROLE_LABEL: Record<string, string> = {
  member: "Membro",
  contributor: "Colaborador",
  moderator: "Moderador",
  admin: "Equipe",
};

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

  return (
    <main id="main" className="page">
      <header className="profile__head">
        <span className="profile__avatar" aria-hidden="true">
          <UserRound className="size-8" />
        </span>
        <div>
          <h1 className="profile__name">{profile.displayName}</h1>
          <p className="profile__meta">
            @{profile.handle} · {ROLE_LABEL[profile.role] ?? profile.role} ·{" "}
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
