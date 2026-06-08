import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Paginação simples por offset. `params` são os filtros atuais a preservar.
 */
export function Pager({
  path,
  page,
  hasMore,
  params = {},
}: {
  path: string;
  page: number;
  hasMore: boolean;
  params?: Record<string, string | undefined>;
}) {
  if (page <= 1 && !hasMore) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${path}?${qs}` : path;
  };

  return (
    <nav aria-label="Paginação" className="mt-8 flex items-center justify-between">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:border-primary/50"
        >
          <ChevronLeft className="size-4" aria-hidden="true" /> Anterior
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted-foreground">Página {page}</span>
      {hasMore ? (
        <Link
          href={href(page + 1)}
          rel="next"
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:border-primary/50"
        >
          Próxima <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
