import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Gamepad2 } from "lucide-react";
import { listDevices, listManufacturers, type DeviceFilters } from "@/lib/devices";
import { Button } from "@/components/ui/button";

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
  searchParams: Promise<{ fabricante?: string; formato?: string }>;
}) {
  const sp = await searchParams;
  const filters: DeviceFilters = {
    manufacturer: sp.fabricante || undefined,
    formFactor: (["vertical", "horizontal", "clamshell", "other"].includes(sp.formato ?? "")
      ? sp.formato
      : undefined) as DeviceFilters["formFactor"],
  };

  const [devices, manufacturers] = await Promise.all([listDevices(filters), listManufacturers()]);

  return (
    <main id="main" className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Consoles</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/consoles/comparar">Comparar</Link>
        </Button>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4" aria-label="Filtros do catálogo">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fabricante" className="text-sm font-medium">Fabricante</label>
          <select
            id="fabricante"
            name="fabricante"
            defaultValue={sp.fabricante ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <option value="">Todos</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="formato" className="text-sm font-medium">Formato</label>
          <select
            id="formato"
            name="formato"
            defaultValue={sp.formato ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <option value="">Todos</option>
            {FORM_FACTORS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm">Filtrar</Button>
        {(sp.fabricante || sp.formato) && (
          <Button asChild type="button" variant="ghost" size="sm">
            <Link href="/consoles">Limpar</Link>
          </Button>
        )}
      </form>

      <p className="mt-4 text-sm text-muted-foreground" role="status" aria-live="polite">
        {devices.length} {devices.length === 1 ? "console encontrado" : "consoles encontrados"}
      </p>

      {devices.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center">
          <Gamepad2 className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum console com esses filtros. Rode o seed para popular o catálogo
            ou ajuste os filtros.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((d) => (
            <li key={d.id}>
              <Link
                href={`/consoles/${d.slug}`}
                className="flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div className="flex h-28 items-center justify-center">
                  {d.frontImage ? (
                    <Image src={d.frontImage} alt={`${d.name}, vista frontal`} width={120} height={112} className="object-contain" />
                  ) : (
                    <Gamepad2 className="size-12 text-muted-foreground/40" aria-hidden="true" />
                  )}
                </div>
                <span className="mt-3 text-xs text-primary">{d.manufacturer}</span>
                <span className="font-semibold">{d.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
