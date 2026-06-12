"use client";

import { Children, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Pagina uma lista de itens (children) no cliente, exibindo `pageSize` por vez.
 *  Renderiza a `<ul>` com a fatia atual + controles quando há mais de uma página. */
export function Paginated({
  children,
  className,
  pageSize = 10,
  label = "itens",
}: {
  children: ReactNode;
  className?: string;
  pageSize?: number;
  label?: string;
}) {
  const items = Children.toArray(children);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const start = safePage * pageSize;
  const slice = items.slice(start, start + pageSize);

  return (
    <>
      <ul className={className}>{slice}</ul>
      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-between gap-3" aria-label={`Paginação de ${label}`}>
          <Button type="button" variant="outline" size="sm" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Anterior
          </Button>
          <span className="muted text-sm tabular-nums">Página {safePage + 1} de {pages}</span>
          <Button type="button" variant="outline" size="sm" disabled={safePage >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>
            Próxima <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </>
  );
}
