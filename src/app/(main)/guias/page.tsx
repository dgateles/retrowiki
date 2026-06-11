import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Eye, MessageSquare } from "lucide-react";
import { listPublishedArticles, typeLabel } from "@/lib/articles";
import { listDevices } from "@/lib/devices";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/ui/pager";
import { FilterBar } from "@/components/catalog/filter-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";

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

function relTime(d: Date) {
  const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `há ${days} d`;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d));
}

function plural(n: number, s: string, p: string) {
  return `${n} ${n === 1 ? s : p}`;
}

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
        <Empty className="mt-8">
          <EmptyHeader>
            <EmptyMedia variant="icon"><BookOpen aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>{deviceSlug || type ? "Nenhum guia encontrado" : "Ainda não há guias"}</EmptyTitle>
            <EmptyDescription>
              {deviceSlug || type
                ? "Nenhum guia corresponde a esses filtros. Tente ajustá-los."
                : "Seja o primeiro a compartilhar um tutorial com a comunidade."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {deviceSlug || type ? (
              <Button asChild variant="outline" size="sm"><Link href="/guias">Limpar filtros</Link></Button>
            ) : (
              <Button asChild size="sm"><Link href="/estudio/novo">Escrever guia</Link></Button>
            )}
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <ul className="guide-list">
            {items.map((a) => (
              <li key={a.id}>
                <Link href={`/guias/${a.slug}`} className="group block">
                  <Card className="card-glow p-5">
                  <Badge variant="secondary" className="font-mono text-[10px] tracking-wider uppercase">{typeLabel(a.type)}</Badge>
                  <h2 className="guide-card__title mt-2">{a.title}</h2>
                  {a.summary && <p className="guide-card__summary">{a.summary}</p>}
                  <div className="guide-card__foot">
                    <p className="guide-card__meta">
                      por @{a.authorHandle}
                      {a.publishedAt && <> · {relTime(a.publishedAt)}</>}
                    </p>
                    <div className="guide-card__stats">
                      <span className="guide-card__stat">
                        <Eye className="size-3.5" aria-hidden="true" /> {plural(Number(a.viewsCount), "visualização", "visualizações")}
                      </span>
                      {Number(a.commentCount) > 0 && (
                        <span className="guide-card__stat">
                          <MessageSquare className="size-3.5" aria-hidden="true" /> {plural(Number(a.commentCount), "comentário", "comentários")}
                        </span>
                      )}
                    </div>
                  </div>
                  </Card>
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
