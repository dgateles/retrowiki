import Link from "next/link";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { listBadgesWithCounts } from "@/lib/badges";
import { getAchievementSettings } from "@/lib/settings";
import { GamificationTools } from "@/components/admin/gamification-tools";
import { BadgeIcon } from "@/components/admin/badge-icon";

export const dynamic = "force-dynamic";

const TIER_LABEL: Record<string, string> = { bronze: "Bronze", silver: "Prata", gold: "Ouro" };

export default async function AdminGamificationPage() {
  const [badges, settings, [members]] = await Promise.all([
    listBadgesWithCounts(),
    getAchievementSettings(),
    db.select({ n: count() }).from(users),
  ]);
  const total = members?.n ?? 0;
  const isRare = (c: number) => !settings.rareNever && total > 0 && c > 0 && (c / total) * 100 < settings.rareThreshold;

  return (
    <>
      <h1 className="page__title">Gamificação</h1>
      <p className="page__note">Ranks por reputação e conquistas (badges).</p>

      <GamificationTools badges={badges.filter((b) => b.manuallyAwardable).map((b) => ({ slug: b.slug, name: b.name }))} />

      <section className="gami-section">
        <h2 className="gami-section__title">Conquistas</h2>
        <ul className="badge-grid">
          {badges.map((b) => (
            <li key={b.slug} className={`badge-card badge-card--${b.tier}`}>
              <BadgeIcon name={b.icon} image={b.image} className="badge-card__icon" />
              <div className="min-w-0">
                <p className="badge-card__name">
                  {b.name}
                  {isRare(b.count) && <span className="badge-rare">Rara</span>}
                </p>
                <p className="badge-card__desc">{b.description}</p>
                <p className="badge-card__meta">{TIER_LABEL[b.tier]} · {b.count} usuário(s)</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="gami-section">
        <h2 className="gami-section__title">Ranks por reputação</h2>
        <p className="muted">
          Os ranks agora são editáveis em <Link href="/admin/ranks" className="link-inline">Conquistas → Ranks</Link>.
        </p>
      </section>
    </>
  );
}
