import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { getProfile } from "@/lib/profiles";
import { getRankRows } from "@/lib/admin/ranks-db";
import { getAchievementSettings } from "@/lib/settings";
import { RankIcon } from "@/components/profile/rank-icon";
import { count } from "@/lib/plural";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const p = await getProfile(handle);
  if (!p) return {};
  return pageMetadata({ title: `Ranks de ${p.displayName}`, description: `Progresso de ${p.displayName} na escala de ranks.`, path: `/u/${p.handle}/ranks` });
}

export default async function RanksPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await getProfile(handle);
  if (!profile) notFound();
  const gami = await getAchievementSettings();
  if (!gami.enabled) notFound();

  const rows = await getRankRows();
  const rep = Math.max(0, profile.reputation);
  // Rank atual = o de maior pontuação já alcançado.
  const earnedIdx = rows.reduce((acc, r, i) => (rep >= r.points ? i : acc), 0);
  const earnedCount = rows.filter((r) => rep >= r.points).length;

  return (
    <main id="main" className="page page--narrow">
      <nav className="forum-crumbs" aria-label="Trilha">
        <Link href={`/u/${profile.handle}`} className="link-inline">{profile.displayName}</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Ranks</span>
      </nav>

      <div className="page__head">
        <div>
          <h1 className="page__title">Progresso de ranks</h1>
          <p className="page__note">
            {profile.displayName} conquistou <strong className="text-foreground">{count(earnedCount, "rank", "ranks")}</strong> de {rows.length}.
          </p>
        </div>
      </div>

      <ol className="rankladder">
        {rows.map((r, i) => {
          const earned = rep >= r.points;
          const current = i === earnedIdx;
          const missing = Math.max(0, r.points - rep);
          return (
            <li key={r.id} className={cn("rankladder__item", earned && "rankladder__item--earned", current && "rankladder__item--current")}>
              <span className="rankladder__medal" aria-hidden="true">
                <RankIcon name={r.icon} className="size-5" />
              </span>
              <div className="rankladder__body">
                <p className="rankladder__title">
                  {r.title}
                  {current && <span className="rankladder__badge">Rank atual</span>}
                </p>
                <p className="rankladder__meta">
                  {earned ? (
                    <><Check className="inline size-3.5 text-success" aria-hidden="true" /> Conquistado</>
                  ) : (
                    <><Lock className="inline size-3.5" aria-hidden="true" /> Faltam {count(missing, "ponto", "pontos")}</>
                  )}
                  <span className="rankladder__req"> · {r.points === 0 ? "inicial" : `${r.points} de reputação`}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
