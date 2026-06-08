import Link from "next/link";
import type { Metadata } from "next";
import { Search, Gamepad2, BookOpen } from "lucide-react";
import { searchAll, type SearchScope } from "@/lib/search";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Buscar" };
export const dynamic = "force-dynamic";

const SCOPES: { key: SearchScope; label: string }[] = [
  { key: "tudo", label: "Tudo" },
  { key: "consoles", label: "Consoles" },
  { key: "guias", label: "Guias" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; escopo?: string }>;
}) {
  const { q = "", escopo } = await searchParams;
  const scope: SearchScope = escopo === "consoles" || escopo === "guias" ? escopo : "tudo";
  const results = q.trim().length >= 2 ? await searchAll(q, scope) : { devices: [], articles: [] };
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
        <input type="hidden" name="escopo" value={scope} />
      </form>

      <nav aria-label="Escopo da busca" className="scope-tabs">
        {SCOPES.map((s) => (
          <Link
            key={s.key}
            href={`/buscar?q=${encodeURIComponent(q)}&escopo=${s.key}`}
            aria-current={scope === s.key ? "page" : undefined}
            className={cn("scope-tabs__link", scope === s.key && "scope-tabs__link--active")}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      {q.trim().length >= 2 && (
        <p className="page__note" role="status" aria-live="polite">
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
