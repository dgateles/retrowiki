import Link from "next/link";
import type { Metadata } from "next";
import { Gamepad2 } from "lucide-react";
import { listDevices, listManufacturers, type DeviceFilters } from "@/lib/devices";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/ui/pager";
import { FilterBar } from "@/components/catalog/filter-bar";
import { DeviceCard } from "@/components/catalog/device-card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";

export const metadata: Metadata = {
  title: "Consoles",
  description: "Catálogo de handhelds retrô com fichas técnicas e scores de emulação por sistema.",
};

const FORM_FACTORS = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
  { value: "clamshell", label: "Clamshell" },
];

export default async function ConsolesPage({
  searchParams,
}: {
  searchParams: Promise<{ fabricante?: string; formato?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const PAGE_SIZE = 24;
  const filters: DeviceFilters = {
    manufacturer: sp.fabricante || undefined,
    formFactor: (["vertical", "horizontal", "clamshell", "other"].includes(sp.formato ?? "")
      ? sp.formato
      : undefined) as DeviceFilters["formFactor"],
  };

  const [all, manufacturers] = await Promise.all([listDevices(filters), listManufacturers()]);
  const offset = (page - 1) * PAGE_SIZE;
  const devices = all.slice(offset, offset + PAGE_SIZE);
  const hasMore = all.length > offset + PAGE_SIZE;

  return (
    <main id="main" className="page">
      <div className="page__head">
        <h1 className="page__title">Consoles</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/consoles/comparar">Comparar</Link>
        </Button>
      </div>

      <FilterBar
        path="/consoles"
        filters={[
          {
            name: "fabricante",
            label: "Fabricante",
            allLabel: "Todos",
            value: sp.fabricante ?? "",
            options: manufacturers.map((m) => ({ value: m, label: m })),
          },
          {
            name: "formato",
            label: "Formato",
            allLabel: "Todos",
            value: sp.formato ?? "",
            options: FORM_FACTORS,
          },
        ]}
      />

      <p className="page__note" role="status" aria-live="polite">
        {devices.length} {devices.length === 1 ? "console encontrado" : "consoles encontrados"}
      </p>

      {devices.length === 0 ? (
        <Empty className="mt-8">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Gamepad2 aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>
              {filters.manufacturer || filters.formFactor
                ? "Nenhum console encontrado"
                : "Catálogo vazio"}
            </EmptyTitle>
            <EmptyDescription>
              {filters.manufacturer || filters.formFactor
                ? "Nenhum console corresponde a esses filtros. Tente ajustá-los."
                : "Os consoles aparecerão aqui assim que forem cadastrados."}
            </EmptyDescription>
          </EmptyHeader>
          {(filters.manufacturer || filters.formFactor) && (
            <EmptyContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/consoles">Limpar filtros</Link>
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <ul className="grid-cards grid-cards--three">
          {devices.map((d) => (
            <li key={d.id}>
              <DeviceCard slug={d.slug} name={d.name} manufacturer={d.manufacturer} frontImage={d.frontImage} />
            </li>
          ))}
        </ul>
      )}
      <Pager path="/consoles" page={page} hasMore={hasMore} params={{ fabricante: sp.fabricante, formato: sp.formato }} />
    </main>
  );
}
