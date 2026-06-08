import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { listPublishedArticles, typeLabel } from "@/lib/articles";
import { listDevices } from "@/lib/devices";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/ui/pager";
import { FilterBar } from "@/components/catalog/filter-bar";

export const metadata: Metadata = {
  title: "Guias e tutoriais",
  description: "Tutoriais, guias de compra e soluções de problemas escritos pela comunidade.",
};
export const dynamic = "force-dynamic";

const TYPES = [
  { value: "tutorial", label: "Tutorial" },
  { value: "buying_guide", label: "Guia de compras" },
  { value: "troubleshooting", label: "Solução de problemas" },
  { value: "firmware", label: "Firmware" },
  { value: "general", label: "Geral" },
];

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; console?: string; tipo?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const deviceSlug = sp.console || undefined;
  const type = TYPES.some((t) => t.value === sp.tipo) ? sp.tipo : undefined;

  const [{ items, hasMore }, devices] = await Promise.all([
    listPublishedArticles({ page, deviceSlug, type }),
    listDevices(),
  ]);

  return (
    <main id="main" className="page">
      <div className="page__head">
        <h1 className="page__title">Guias e tutoriais</h1>
        <Button asChild size="sm">
          <Link href="/estudio/novo">Escrever</Link>
        </Button>
      </div>

      <FilterBar
        path="/guias"
        filters={[
          {
            name: "console",
            label: "Console",
            allLabel: "Todos",
            value: deviceSlug ?? "",
            options: devices.map((d) => ({ value: d.slug, label: d.name })),
          },
          {
            name: "tipo",
            label: "Tipo",
            allLabel: "Todos",
            value: type ?? "",
            options: TYPES,
          },
        ]}
      />

      {items.length === 0 ? (
        <div className="empty mt-8">
          <BookOpen className="empty__icon" aria-hidden="true" />
          <p className="empty__text">Nenhum guia com esses filtros.</p>
        </div>
      ) : (
        <>
          <ul className="guide-list">
            {items.map((a) => (
              <li key={a.id}>
                <Link href={`/guias/${a.slug}`} className="guide-card">
                  <span className="guide-card__kind">{typeLabel(a.type)}</span>
                  <h2 className="guide-card__title">{a.title}</h2>
                  {a.summary && <p className="guide-card__summary">{a.summary}</p>}
                  <p className="guide-card__meta">por @{a.authorHandle}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Pager path="/guias" page={page} hasMore={hasMore} params={{ console: deviceSlug, tipo: type }} />
        </>
      )}
    </main>
  );
}
