import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profiles";
import { getCurrentUser, can } from "@/lib/auth-helpers";
import { ProfileEditMenu } from "@/components/profile/profile-edit-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Mail } from "lucide-react";
import { getVisibleFields } from "@/lib/profile-fields";
import { getReputationSettings } from "@/lib/settings";
import { levelForReputation } from "@/lib/reputation-levels";
import { ProfileFieldsDisplay } from "@/components/profile/profile-fields-display";
import { ProfileGallery } from "@/components/profile/profile-gallery";
import { Paginated } from "@/components/ui/paginated";
import { typeLabel } from "@/lib/articles";
import { roleLabel } from "@/lib/ranks";
import { getRankForReputation } from "@/lib/admin/ranks-db";
import { evaluateBadges, getUserBadges } from "@/lib/badges";
import { getAchievementSettings, getWarningSettings } from "@/lib/settings";
import { activePoints, isPostingRestricted } from "@/lib/warnings";
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
  const gallerySettings = await getGallerySettings();
  const { getUserActivity } = await import("@/lib/activity");
  const activity = await getUserActivity(profile.id, 60);
  const userBadges = gami.enabled ? await getUserBadges(profile.id) : [];
  const joined = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(profile.createdAt),
  );
  const lastSeen = lastSeenText(profile.lastSeenAt);

  // Relação do visitante: dono do perfil ou membro da equipe.
  const isOwner = Boolean(viewer && Number(viewer.id) === profile.id);
  const isStaff = can.moderate(viewer);
  const canSeePrivate = isOwner || isStaff;

  // Galeria: staff vê as ocultas (para moderar); demais veem só as visíveis.
  const { listPhotos, listPhotosManage, listAlbums } = await import("@/lib/gallery");
  const photos = gallerySettings.enabled ? (isStaff ? await listPhotosManage(profile.id) : await listPhotos(profile.id)) : [];
  const galleryAlbums = gallerySettings.enabled && photos.length ? await listAlbums(profile.id) : [];
  const { listReportTypes } = await import("@/lib/reports");
  const { getReportingSettings } = await import("@/lib/settings");
  const galleryReportTypes = !isOwner && viewer && photos.length ? await listReportTypes() : [];
  const galleryReportMandatory = galleryReportTypes.length ? (await getReportingSettings()).messageMandatory : false;

  // Advertências (privadas): só o dono ou a equipe veem.
  const warnSettings = await getWarningSettings();
  const warnPoints = canSeePrivate && warnSettings.enabled ? await activePoints(profile.id) : 0;
  const restricted = canSeePrivate && warnSettings.enabled ? await isPostingRestricted(profile.id) : false;

  // E-mail: visível só para a equipe (e para o dono).
  let profileEmail: string | null = null;
  if (canSeePrivate) {
    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const [row] = await db.select({ email: users.email }).from(users).where(eq(users.id, profile.id)).limit(1);
    profileEmail = row?.email ?? null;
  }

  return (
    <main id="main" className="page">
      <div className="profile-cover scanlines">
        {profile.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.coverUrl} alt="" className="profile-cover__img" aria-hidden="true" />
        )}
        {isOwner && (
          <div className="profile-cover__edit">
            <ProfileEditMenu />
          </div>
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
          {isOwner && (
            <Button asChild size="sm" className="profile-id__activity">
              <Link href="#atividade"><FileText className="size-4" aria-hidden="true" /> Ver minha atividade</Link>
            </Button>
          )}
        </div>
      </header>

      <div className="profile-grid">
        <aside className="profile-side">
          {canSeePrivate && warnSettings.enabled && (
            <Card>
              <CardContent className="pt-6">
                <p className="font-mono text-lg font-semibold tabular-nums">{warnPoints} {warnPoints === 1 ? "ponto" : "pontos"} de advertência</p>
                <p className="mt-1 text-sm text-muted-foreground">{restricted ? "Postagem restrita por advertências." : "Nenhuma restrição aplicada."}</p>
              </CardContent>
            </Card>
          )}

          {rank && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{rank.label}</span>
                  <span className="text-xs text-muted-foreground">Rank {rank.index} de {rank.total}</span>
                </div>
                <progress
                  className="rank__progress"
                  value={Math.round(rank.progress * 100)}
                  max={100}
                  aria-label={`Progresso no rank ${rank.label}`}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {rank.next === null
                    ? "Rank máximo alcançado."
                    : `${rank.pointsToNext} ${rank.pointsToNext === 1 ? "ponto" : "pontos"} até o próximo rank.`}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="divide-y divide-border px-6 py-1">
              <dl>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-sm text-muted-foreground">Publicações</dt>
                  <dd className="font-mono font-semibold tabular-nums">{profile.articles.length}</dd>
                </div>
                {repSettings.showOnProfile && (
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-sm text-muted-foreground">Reputação</dt>
                    <dd className="flex items-center gap-2 font-mono font-semibold tabular-nums text-primary">
                      {profile.reputation}
                      {repLevel && <Badge variant="secondary" className="font-sans text-[10px]">{repLevel.title}</Badge>}
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-sm text-muted-foreground">Papel</dt>
                  <dd className="text-sm font-medium">{roleLabel(profile.role)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {gami.enabled && (
            <Card>
              <CardHeader>
                <h2 id="p-badges" className="text-base font-semibold leading-none">Conquistas</h2>
              </CardHeader>
              <CardContent><BadgeList items={userBadges} /></CardContent>
            </Card>
          )}

          {profileEmail && (
            <Card>
              <CardContent className="pt-6">
                <p className="flex items-center gap-1.5 text-sm font-medium"><Mail className="size-4 text-muted-foreground" aria-hidden="true" /> E-mail</p>
                <p className="mt-1 text-sm">{profileEmail}</p>
                <p className="mt-1 text-xs text-muted-foreground">Só a equipe vê os endereços de e-mail.</p>
              </CardContent>
            </Card>
          )}
        </aside>

        <div className="profile-main">
          <ProfileFieldsDisplay groups={profileFields} />

          <ProfileGallery
            photos={photos}
            albums={galleryAlbums}
            reportTypes={galleryReportTypes}
            canReport={Boolean(!isOwner && viewer)}
            isStaff={isStaff}
            messageMandatory={galleryReportMandatory}
          />

          <section aria-labelledby="contrib">
          <h2 id="contrib" className="comments__title">
            Publicações ({profile.articles.length})
          </h2>
          {profile.articles.length === 0 ? (
            <p className="empty mt-4">Nenhuma publicação ainda.</p>
          ) : (
            <Paginated className="link-list" pageSize={10} label="publicações">
              {profile.articles.map((a) => (
                <li key={a.id}>
                  <Link href={`/guias/${a.slug}`} className="link-card">
                    <span className="link-card__title">{a.title}</span>
                    <span className="link-card__meta">{typeLabel(a.type)}</span>
                  </Link>
                </li>
              ))}
            </Paginated>
          )}
          </section>

          <section aria-labelledby="atividade" id="atividade" className="mt-8">
            <h2 id="atividade" className="comments__title">Atividade recente</h2>
            {activity.length === 0 ? (
              <p className="empty mt-4">Sem atividade recente.</p>
            ) : (
              <Paginated className="activity mt-4" pageSize={10} label="atividade">
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
              </Paginated>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
