import Link from "next/link";
import { Home, ExternalLink, Pencil, FileText } from "lucide-react";
import { listPages } from "@/lib/pages";
import { NewPageButton } from "@/components/admin/new-page-button";
import { HomePageButton } from "@/components/admin/home-page-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

export const dynamic = "force-dynamic";

export default async function PagesAdminPage() {
  const items = await listPages();
  const hasHome = items.some((p) => p.isHome);
  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="page__title">Páginas</h1>
          <p className="page__note">Monte páginas próprias (Sobre, Regras, landing) no construtor visual. A página inicial também é editável. Header e rodapé continuam fixos.</p>
        </div>
        <div className="flex items-center gap-2">
          <HomePageButton hasHome={hasHome} />
          <NewPageButton />
        </div>
      </div>

      {items.length === 0 ? (
        <Empty className="mt-8">
          <EmptyHeader>
            <EmptyMedia variant="icon"><FileText aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>Nenhuma página ainda</EmptyTitle>
            <EmptyDescription>Crie a primeira página no construtor visual.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map((p) => (
            <li key={p.id}>
              <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                    {p.isHome ? <Home className="size-4" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}
                  </span>
                  <div className="min-w-0">
                    <Link href={`/construtor/${p.id}`} className="block truncate font-semibold hover:text-primary">{p.title}</Link>
                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                      {p.isHome ? "/" : `/p/${p.slug}`}{p.showInMenu && " · no menu"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pl-3">
                  {p.isHome && <Badge variant="secondary" className="gap-1"><Home className="size-3" aria-hidden="true" /> Inicial</Badge>}
                  <Badge variant={p.status === "published" ? "default" : "outline"}>
                    {p.status === "published" ? "Publicada" : "Rascunho"}
                  </Badge>
                  {p.status === "published" && (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={p.isHome ? "/" : `/p/${p.slug}`} target="_blank"><ExternalLink className="size-4" aria-hidden="true" /> Ver</Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/construtor/${p.id}`}><Pencil className="size-4" aria-hidden="true" /> Editar</Link>
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
