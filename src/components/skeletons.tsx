import { Skeleton } from "@/components/ui/skeleton";

/** Cabeçalho de página (título + nota). */
export function PageHeadSkeleton({ note = false }: { note?: boolean }) {
  return (
    <div className="page__head">
      <div>
        <Skeleton className="h-8 w-56" />
        {note && <Skeleton className="mt-2 h-4 w-72" />}
      </div>
    </div>
  );
}

/** Card de console (imagem + fabricante + nome). */
export function DeviceCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <Skeleton className="mt-3 h-3.5 w-16" />
      <Skeleton className="mt-2 h-5 w-3/4" />
    </div>
  );
}

export function DeviceGridSkeleton({ count = 9, className = "mt-8" }: { count?: number; className?: string }) {
  return (
    <ul className={`grid-cards grid-cards--three ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <DeviceCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

/** Card de guia (badge + título + descrição + meta). */
export function GuideCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-3 h-6 w-2/3" />
      <Skeleton className="mt-2.5 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-5/6" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

export function GuideListSkeleton({ count = 6, className = "mt-6" }: { count?: number; className?: string }) {
  return (
    <ul className={`guide-list ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <GuideCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

/** Linhas de filtro/toolbar acima das listas. */
export function FilterBarSkeleton() {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-9 w-24" />
    </div>
  );
}

/** Bloco de cartões de estatística (painel). */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
