import Link from "next/link";
import type { Metadata } from "next";
import { Search, Gamepad2, BookOpen } from "lucide-react";
import { searchAll } from "@/lib/search";

export const metadata: Metadata = { title: "Buscar" };
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q.trim().length >= 2 ? await searchAll(q) : { devices: [], articles: [] };
  const total = results.devices.length + results.articles.length;

  return (
    <main id="main" className="page">
      <h1 className="page__title">Buscar</h1>

      <form method="get" role="search" className="search mt-6">
        <label htmlFor="q" className="sr-only">Buscar consoles e guias</label>
        <Search className="search__icon" aria-hidden="true" />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Console, firmware, problema…"
          className="search__input"
        />
      </form>

      {q.trim().length >= 2 && (
        <p className="mt-4 text-sm text-muted-foreground" role="status" aria-live="polite">
          {total} {total === 1 ? "resultado" : "resultados"} para “{q}”
        </p>
      )}

      {results.devices.length > 0 && (
        <section aria-labelledby="r-devices" className="results__group">
          <h2 id="r-devices" className="results__group-title">
            <Gamepad2 className="size-4" aria-hidden="true" /> Consoles
          </h2>
          <ul className="results__list">
            {results.devices.map((d) => (
              <li key={d.slug}>
                <Link href={`/consoles/${d.slug}`} className="results__item">
                  <span className="results__item-title">{d.name}</span>
                  <span className="link-card__meta">{d.manufacturer}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.articles.length > 0 && (
        <section aria-labelledby="r-articles" className="results__group">
          <h2 id="r-articles" className="results__group-title">
            <BookOpen className="size-4" aria-hidden="true" /> Guias
          </h2>
          <ul className="results__list">
            {results.articles.map((a) => (
              <li key={a.slug}>
                <Link href={`/guias/${a.slug}`} className="results__item">
                  <span className="results__item-title">{a.title}</span>
                  {a.summary && <p className="results__item-sub">{a.summary}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {q.trim().length >= 2 && total === 0 && (
        <p className="empty mt-8">Nada encontrado para “{q}”. Tente outros termos.</p>
      )}
    </main>
  );
}
