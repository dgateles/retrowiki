import type { Metadata } from "next";
import Link from "next/link";
import { getDirectory, type StaffCard } from "@/lib/staff-directory";

export const metadata: Metadata = {
  title: "Equipe",
  description: "Conheça a equipe que mantém a RetroWiki.",
};
export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function Avatar({ card }: { card: StaffCard }) {
  return card.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="staff-card__avatar" src={card.avatarUrl} alt="" loading="lazy" />
  ) : (
    <span className="staff-card__avatar staff-card__avatar--fallback" aria-hidden="true">{initials(card.name)}</span>
  );
}

function Card({ card }: { card: StaffCard }) {
  const inner = (
    <>
      <Avatar card={card} />
      <span className="staff-card__body">
        <span className="staff-card__name">{card.name}</span>
        {card.title && <span className="staff-card__title">{card.title}</span>}
        {card.bio && <span className="staff-card__bio">{card.bio}</span>}
      </span>
    </>
  );
  return card.handle ? (
    <Link href={`/u/${card.handle}`} className="staff-card staff-card--link">{inner}</Link>
  ) : (
    <div className="staff-card">{inner}</div>
  );
}

export default async function StaffDirectoryPage() {
  const directory = await getDirectory();

  return (
    <main className="page" id="main">
      <header className="page__head">
        <div>
          <h1 className="page__title">Equipe</h1>
          <p className="page__note">As pessoas que mantêm a RetroWiki funcionando.</p>
        </div>
      </header>

      {directory.length === 0 ? (
        <p className="empty mt-6">O diretório da equipe ainda não foi configurado.</p>
      ) : (
        <div className="staff-dir mt-6">
          {directory.map((cat) => (
            <section key={cat.id} className="staff-dir__cat" aria-labelledby={`cat-${cat.id}`}>
              <h2 id={`cat-${cat.id}`} className="staff-dir__title">{cat.title}</h2>
              <div className={`staff-dir__cards staff-dir__cards--${cat.layout}`}>
                {cat.cards.map((card, i) => <Card key={`${card.handle ?? "x"}-${i}`} card={card} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
