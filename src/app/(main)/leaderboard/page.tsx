import Link from "next/link";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { getLeaderboardData, type LeaderMember } from "@/lib/leaderboard";

export const metadata: Metadata = { title: "Leaderboard", description: "Os membros e guias em destaque na comunidade RetroWiki." };
export const dynamic = "force-dynamic";

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase();
}

function MemberRow({ m, i, metric }: { m: LeaderMember; i: number; metric: string }) {
  return (
    <li className="lb-row">
      <span className={cn("lb-row__rank tabular-nums", i === 0 && "glow-text")}>{i + 1}</span>
      <span className="lb-row__avatar" aria-hidden="true">
        {m.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.avatarUrl} alt="" className="lb-row__avatar-img" />
        ) : (
          initials(m.displayName)
        )}
      </span>
      <Link href={`/u/${m.handle}`} className="lb-row__name link-inline">{m.displayName}</Link>
      <span className="lb-row__metric tabular-nums">{metric}</span>
    </li>
  );
}

export default async function LeaderboardPage() {
  const data = await getLeaderboardData();

  if (!data.enabled) {
    return (
      <main id="main" className="page">
        <h1 className="page__title">Leaderboard</h1>
        <p className="empty mt-4">O leaderboard está desativado.</p>
      </main>
    );
  }

  return (
    <main id="main" className="page">
      <h1 className="page__title">Leaderboard</h1>
      <p className="page__note">Destaques da comunidade por reputação e reações.</p>

      <div className="lb-grid">
        <section className="lb-card" aria-labelledby="lb-today">
          <h2 id="lb-today" className="lb-card__title">Destaques de hoje</h2>
          {data.todayMembers.length === 0 ? (
            <p className="muted">Ninguém pontuou hoje ainda.</p>
          ) : (
            <ol className="lb-list">
              {data.todayMembers.map((m, i) => (
                <MemberRow key={m.id} m={m} i={i} metric={`${m.gained ?? 0} pts`} />
              ))}
            </ol>
          )}
        </section>

        <section className="lb-card" aria-labelledby="lb-content">
          <h2 id="lb-content" className="lb-card__title">Guias em alta hoje</h2>
          {data.todayContent.length === 0 ? (
            <p className="muted">Sem reações hoje ainda.</p>
          ) : (
            <ol className="lb-list">
              {data.todayContent.map((c, i) => (
                <li key={c.id} className="lb-row">
                  <span className={cn("lb-row__rank tabular-nums", i === 0 && "glow-text")}>{i + 1}</span>
                  <Link href={`/guias/${c.slug}`} className="lb-row__name link-inline">{c.title}</Link>
                  <span className="lb-row__metric tabular-nums">{c.reactions} {c.reactions === 1 ? "reação" : "reações"}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="lb-card" aria-labelledby="lb-top">
          <h2 id="lb-top" className="lb-card__title">Top membros</h2>
          {data.topMembers.length === 0 ? (
            <p className="muted">Sem dados ainda.</p>
          ) : (
            <ol className="lb-list">
              {data.topMembers.map((m, i) => (
                <MemberRow key={m.id} m={m} i={i} metric={`${m.reputation} pts`} />
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
