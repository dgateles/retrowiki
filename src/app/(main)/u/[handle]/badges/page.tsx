import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { getProfile } from "@/lib/profiles";
import { getUserBadges, listBadgesWithCounts } from "@/lib/badges";
import { getAchievementSettings } from "@/lib/settings";
import { BadgeIcon } from "@/components/profile/badge-icon";
import { count } from "@/lib/plural";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const p = await getProfile(handle);
  if (!p) return {};
  return pageMetadata({ title: `Conquistas de ${p.displayName}`, description: `Badges conquistadas por ${p.displayName}.`, path: `/u/${p.handle}/badges` });
}

export default async function BadgesPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await getProfile(handle);
  if (!profile) notFound();
  const gami = await getAchievementSettings();
  if (!gami.enabled) notFound();

  const [earned, catalog] = await Promise.all([getUserBadges(profile.id), listBadgesWithCounts()]);
  const earnedSlugs = new Set(earned.map((b) => b.slug));
  const locked = catalog.filter((b) => !earnedSlugs.has(b.slug));

  return (
    <main id="main" className="page page--narrow">
      <nav className="forum-crumbs" aria-label="Trilha">
        <Link href={`/u/${profile.handle}`} className="link-inline">{profile.displayName}</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Conquistas</span>
      </nav>

      <div className="page__head">
        <div>
          <h1 className="page__title">Conquistas</h1>
          <p className="page__note">
            {profile.displayName} conquistou <strong className="text-foreground">{count(earned.length, "badge", "badges")}</strong> de {catalog.length}.
          </p>
        </div>
      </div>

      {earned.length > 0 ? (
        <section aria-labelledby="b-earned">
          <h2 id="b-earned" className="badgegrid__heading">{count(earned.length, "badge conquistada", "badges conquistadas")}</h2>
          <ul className="badgegrid">
            {earned.map((b) => (
              <li key={b.slug} className="badgecard">
                <span className={cn("badgecard__icon", `badgecard__icon--${b.tier}`)} aria-hidden="true">
                  <BadgeIcon name={b.icon} className="size-5" />
                </span>
                <div className="badgecard__body">
                  <p className="badgecard__name">{b.name}</p>
                  <p className="badgecard__desc">{b.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="empty mt-6">Nenhuma conquista ainda.</p>
      )}

      {locked.length > 0 && (
        <section aria-labelledby="b-locked" className="mt-8">
          <h2 id="b-locked" className="badgegrid__heading">A conquistar</h2>
          <ul className="badgegrid">
            {locked.map((b) => (
              <li key={b.slug} className="badgecard badgecard--locked">
                <span className="badgecard__icon badgecard__icon--locked" aria-hidden="true">
                  <Lock className="size-4" />
                </span>
                <div className="badgecard__body">
                  <p className="badgecard__name">{b.name}</p>
                  <p className="badgecard__desc">{b.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
