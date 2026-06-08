import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { listPublishedArticles, typeLabel } from "@/lib/articles";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Guias e tutoriais",
  description: "Tutoriais, guias de compra e soluções de problemas escritos pela comunidade.",
};

// Lista muda conforme publicações; renderiza sob demanda.
export const dynamic = "force-dynamic";

export default async function GuidesPage() {
  const items = await listPublishedArticles();

  return (
    <main id="main" className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Guias e tutoriais</h1>
        <Button asChild size="sm">
          <Link href="/estudio/novo">Escrever</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">
            Ainda não há guias publicados. Seja o primeiro a contribuir.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((a) => (
            <li key={a.id}>
              <Link
                href={`/guias/${a.slug}`}
                className="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <span className="text-xs font-medium text-primary">{typeLabel(a.type)}</span>
                <h2 className="mt-1 font-semibold">{a.title}</h2>
                {a.summary && <p className="mt-1 text-sm text-muted-foreground">{a.summary}</p>}
                <p className="mt-2 text-xs text-muted-foreground">por @{a.authorHandle}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
