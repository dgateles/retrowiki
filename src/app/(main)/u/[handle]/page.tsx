import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profiles";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getVisibleFields } from "@/lib/profile-fields";
import { getReputationSettings } from "@/lib/settings";
import { levelForReputation } from "@/lib/reputation-levels";
import { ProfileFieldsDisplay } from "@/components/profile/profile-fields-display";
import { typeLabel } from "@/lib/articles";
import { roleLabel } from "@/lib/ranks";
import { getRankForReputation } from "@/lib/admin/ranks-db";
import { evaluateBadges, getUserBadges } from "@/lib/badges";
import { getAchievementSettings } from "@/lib/settings";
import { BadgeList } from "@/components/badges/badge-list";
import { BookOpen, MessageCircle, Award } from "lucide-react";

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

function relDate(d: Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(d));
}

function lastSeenText(d: Date | null): string | null {
  if (!d) return null;
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 5 * 60 * 1000) return "Online agora";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Visto por último há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Visto por último há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Visto por último há ${days} ${days === 1 ? "dia" : "dias"}`;
  return `Visto por último em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(d))}`;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await getProfile(handle);
  if (!profile) notFound();

  const viewer = await getCurrentUser();
  const profileFields = await getVisibleFields(profile.id, viewer ? { id: Number(viewer.id), role: viewer.role } : null);
  const repSettings = await getReputationSettings();
  const repLevel = repSettings.showOnProfile ? await levelForReputation(profile.reputation) : null;
  const gami = await getAchievementSettings();
  const rank = gami.enabled ? await getRankForReputation(profile.reputation) : null;
  if (gami.enabled) await evaluateBadges(profile.id);
  const { getGallerySettings } = await import("@/lib/settings");
  const { listPhotos } = await import("@/lib/gallery");
  const gallerySettings = await getGallerySettings();
  const photos = gallerySettings.enabled ? await listPhotos(profile.id) : [];
  const { getUserActivity } = await import("@/lib/activity");
  const activity = await getUserActivity(profile.id, 15);
  const userBadges = gami.enabled ? await getUserBadges(profile.id) : [];
  const joined = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(profile.createdAt),
  );
  const lastSeen = lastSeenText(profile.lastSeenAt);

  return (
    <main id="main" className="page">
      <div className="profile-cover" aria-hidden="true">
        {profile.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.coverUrl} alt="" className="profile-cover__img" />
        )}
      </div>

      <header className="profile-id">
        <span className="profile-id__avatar" aria-hidden="true">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" className="profile-id__avatar-img" />
          ) : (
            initials(profile.displayName)
          )}
        </span>
        <div className="profile-id__body">
          <div>
            <h1 className="profile-id__name">{profile.displayName}</h1>
            <p className="profile-id__role">@{profile.handle} · {roleLabel(profile.role)}</p>
            <p className="profile-id__meta">Na comunidade desde {joined}</p>
            {lastSeen && <p className="profile-id__meta">{lastSeen}</p>}
          </div>
        </div>
      </header>

      <div className="profile-grid">
        <aside className="profile-side">
          {rank && (
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
          )}

          <dl className="profile-stats">
            <div className="profile-stat">
              <dt className="profile-stat__label">Publicações</dt>
              <dd className="profile-stat__value">{profile.articles.length}</dd>
            </div>
            {repSettings.showOnProfile && (
              <div className="profile-stat">
                <dt className="profile-stat__label">Reputação</dt>
                <dd className="profile-stat__value profile-stat__value--accent">
                  {profile.reputation}
                  {repLevel && <span className="profile-stat__level">{repLevel.title}</span>}
                </dd>
              </div>
            )}
            <div className="profile-stat">
              <dt className="profile-stat__label">Papel</dt>
              <dd className="profile-stat__value">{roleLabel(profile.role)}</dd>
            </div>
          </dl>

          {gami.enabled && (
            <section aria-labelledby="p-badges" className="panel-section">
              <div className="panel-section__head">
                <h2 id="p-badges" className="panel-section__title">Conquistas</h2>
              </div>
              <BadgeList items={userBadges} />
            </section>
          )}
        </aside>

        <div className="profile-main">
          <ProfileFieldsDisplay groups={profileFields} />

          {photos.length > 0 && (
            <section aria-labelledby="p-gallery">
              <h2 id="p-gallery" className="comments__title">Galeria</h2>
              <ul className="gallery-grid gallery-grid--view mt-4">
                {photos.map((p) => (
                  <li key={p.id} className="gallery-grid__item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.caption} className="gallery-grid__img" loading="lazy" />
                    {p.caption && <span className="gallery-grid__cap">{p.caption}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

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

          <section aria-labelledby="atividade" id="atividade" className="mt-8">
            <h2 id="atividade" className="comments__title">Atividade recente</h2>
            {activity.length === 0 ? (
              <p className="empty mt-4">Sem atividade recente.</p>
            ) : (
              <ul className="activity mt-4">
                {activity.map((a, i) => (
                  <li key={i} className="activity__item">
                    <span className="activity__icon" aria-hidden="true">
                      {a.kind === "guide" ? <BookOpen className="size-4" /> : a.kind === "comment" ? <MessageCircle className="size-4" /> : <Award className="size-4" />}
                    </span>
                    <span className="activity__text">
                      {a.kind === "guide" && <>Publicou o guia <Link href={`/guias/${a.slug}`} className="link-inline">{a.title}</Link></>}
                      {a.kind === "comment" && <>Comentou em <Link href={`/guias/${a.articleSlug}#comentario-${a.commentId}`} className="link-inline">{a.articleTitle}</Link></>}
                      {a.kind === "badge" && <>Conquistou a badge <strong>{a.name}</strong></>}
                    </span>
                    <span className="activity__date muted">{relDate(a.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
