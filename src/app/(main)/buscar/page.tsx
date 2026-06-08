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
    <main id="main" className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">Buscar</h1>

      <form method="get" role="search" className="mt-6 flex gap-2">
        <label htmlFor="q" className="sr-only">Buscar consoles e guias</label>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Console, firmware, problema…"
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        </div>
      </form>

      {q.trim().length >= 2 && (
        <p className="mt-4 text-sm text-muted-foreground" role="status" aria-live="polite">
          {total} {total === 1 ? "resultado" : "resultados"} para “{q}”
        </p>
      )}

      {results.devices.length > 0 && (
        <section aria-labelledby="r-devices" className="mt-6">
          <h2 id="r-devices" className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Gamepad2 className="size-4" aria-hidden="true" /> Consoles
          </h2>
          <ul className="space-y-2">
            {results.devices.map((d) => (
              <li key={d.slug}>
                <Link href={`/consoles/${d.slug}`} className="block rounded-lg border border-border bg-card p-3 hover:border-primary/50">
                  <span className="font-medium">{d.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{d.manufacturer}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.articles.length > 0 && (
        <section aria-labelledby="r-articles" className="mt-6">
          <h2 id="r-articles" className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <BookOpen className="size-4" aria-hidden="true" /> Guias
          </h2>
          <ul className="space-y-2">
            {results.articles.map((a) => (
              <li key={a.slug}>
                <Link href={`/guias/${a.slug}`} className="block rounded-lg border border-border bg-card p-3 hover:border-primary/50">
                  <span className="font-medium">{a.title}</span>
                  {a.summary && <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{a.summary}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {q.trim().length >= 2 && total === 0 && (
        <p className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nada encontrado para “{q}”. Tente outros termos.
        </p>
      )}
    </main>
  );
}
