import { BookOpen, PenLine, Library, MessageCircle, MessagesSquare, Star, Trophy, Award, type LucideIcon } from "lucide-react";
import { rankTiers } from "@/lib/ranks";
import { listBadgesWithCounts } from "@/lib/badges";
import { GamificationTools } from "@/components/admin/gamification-tools";

export const dynamic = "force-dynamic";

const ICONS: Record<string, LucideIcon> = {
  BookOpen, PenLine, Library, MessageCircle, MessagesSquare, Star, Trophy, Award,
};

const TIER_LABEL: Record<string, string> = { bronze: "Bronze", silver: "Prata", gold: "Ouro" };

export default async function AdminGamificationPage() {
  const tiers = rankTiers();
  const badges = await listBadgesWithCounts();

  return (
    <>
      <h1 className="page__title">Gamificação</h1>
      <p className="page__note">Ranks por reputação e conquistas (badges).</p>

      <GamificationTools badges={badges.map((b) => ({ slug: b.slug, name: b.name }))} />

      <section className="gami-section">
        <h2 className="gami-section__title">Conquistas</h2>
        <ul className="badge-grid">
          {badges.map((b) => {
            const Icon = ICONS[b.icon] ?? Award;
            return (
              <li key={b.slug} className={`badge-card badge-card--${b.tier}`}>
                <Icon className="badge-card__icon" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="badge-card__name">{b.name}</p>
                  <p className="badge-card__desc">{b.description}</p>
                  <p className="badge-card__meta">{TIER_LABEL[b.tier]} · {b.count} usuário(s)</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="gami-section">
        <h2 className="gami-section__title">Ranks por reputação</h2>
        <ol className="rank-list">
          {tiers.map((t) => (
            <li key={t.index} className="rank-row">
              <span className="rank-row__index">{t.index}/{tiers.length}</span>
              <span className="rank-row__label">{t.label}</span>
              <span className="rank-row__at">{t.at.toLocaleString("pt-BR")} pts</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
