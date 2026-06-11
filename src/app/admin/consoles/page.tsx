import Link from "next/link";
import { Plus, Gamepad2 } from "lucide-react";
import { listAllDevices } from "@/lib/admin/devices";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption,
} from "@/components/ui/table";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  published: { label: "Publicado", variant: "default" },
  draft: { label: "Rascunho", variant: "secondary" },
  archived: { label: "Arquivado", variant: "outline" },
};

export default async function AdminConsolesPage() {
  const items = await listAllDevices();

  return (
    <>
      <div className="page__head">
        <h1 className="page__title">Consoles</h1>
        <Button asChild size="sm">
          <Link href="/admin/consoles/novo">
            <Plus className="size-4" aria-hidden="true" /> Novo
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <Empty className="mt-6">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Gamepad2 aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>Nenhum console cadastrado</EmptyTitle>
            <EmptyDescription>Cadastre o primeiro handheld do catálogo.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild size="sm"><Link href="/admin/consoles/novo">Novo console</Link></Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableCaption className="sr-only">Lista de consoles</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((d) => {
                const st = STATUS[d.status] ?? { label: d.status, variant: "secondary" as const };
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Link href={`/admin/consoles/${d.id}`} className="font-medium hover:text-primary hover:underline">{d.name}</Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{d.manufacturer}</TableCell>
                    <TableCell className="font-mono tabular-nums text-muted-foreground">{d.releaseYear ?? "—"}</TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
