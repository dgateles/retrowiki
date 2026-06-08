import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { listPublishedArticles, typeLabel } from "@/lib/articles";
import { listDevices } from "@/lib/devices";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/ui/pager";

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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Guias e tutoriais</h1>
        <Button asChild size="sm">
          <Link href="/estudio/novo">Escrever</Link>
        </Button>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3" aria-label="Filtros de guias">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="console" className="text-sm font-medium">Console</label>
          <select
            id="console"
            name="console"
            defaultValue={deviceSlug ?? ""}
            className="h-10 min-w-44 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <option value="">Todos</option>
            {devices.map((d) => (
              <option key={d.id} value={d.slug}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tipo" className="text-sm font-medium">Tipo</label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={type ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <option value="">Todos</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm">Filtrar</Button>
        {(deviceSlug || type) && (
          <Button asChild type="button" variant="ghost" size="sm">
            <Link href="/guias">Limpar</Link>
          </Button>
        )}
      </form>

      {items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum guia com esses filtros.</p>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
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
          <Pager path="/guias" page={page} hasMore={hasMore} params={{ console: deviceSlug, tipo: type }} />
        </>
      )}
    </main>
  );
}
