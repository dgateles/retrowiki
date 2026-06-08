import Link from "next/link";
import type { Metadata } from "next";
import { Gamepad2 } from "lucide-react";
import { listDevices } from "@/lib/devices";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Consoles",
  description: "Catálogo de handhelds retrô com fichas técnicas e scores de emulação.",
};

export default async function ConsolesPage() {
  const devices = await listDevices();

  return (
    <main id="main" className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Consoles</h1>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Início</Link>
        </Button>
      </div>

      {devices.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border p-10 text-center">
          <Gamepad2 className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">
            O catálogo será populado pela migração do conteúdo e por contribuições
            da comunidade. Volte em breve.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((d) => (
            <li key={d.id}>
              <Link
                href={`/consoles/${d.slug}`}
                className="block rounded-lg border border-border bg-card p-5 hover:border-primary/50"
              >
                <span className="text-xs text-primary">{d.manufacturer}</span>
                <h2 className="mt-1 font-semibold">{d.name}</h2>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
