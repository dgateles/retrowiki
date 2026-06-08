import Link from "next/link";
import Image from "next/image";
import { Gamepad2, ArrowRight, GitCompare } from "lucide-react";
import { listDevices } from "@/lib/devices";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const devices = await listDevices();

  return (
    <div className="flex min-h-dvh flex-col">
      <main id="main" className="flex-1">
        {/* Hero compacto */}
        <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
          <div className="mx-auto max-w-6xl px-6 py-14 text-center">
            <p className="text-sm font-medium text-primary">Comunidade de handhelds retrô</p>
            <h1 className="mx-auto mt-2 max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
              O catálogo e os guias de emulação portátil, feitos pela comunidade
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Fichas técnicas, comparador, tutoriais e firmware num só lugar, com curadoria.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/guias">Explorar guias</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/consoles/comparar">
                  <GitCompare className="size-4" aria-hidden="true" /> Comparar consoles
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Grid de consoles, estilo catálogo */}
        <section aria-labelledby="consoles" className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 id="consoles" className="text-2xl font-bold">Consoles</h2>
            <Link href="/consoles" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              Ver todos <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {devices.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              O catálogo será populado pelo seed.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {devices.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/consoles/${d.slug}`}
                    className="group flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
                  >
                    {/* caixa de imagem com tamanho padrão */}
                    <div className="flex h-32 items-center justify-center">
                      {d.frontImage ? (
                        <Image
                          src={d.frontImage}
                          alt={`${d.name}, vista frontal`}
                          width={160}
                          height={120}
                          className="max-h-full w-auto object-contain"
                        />
                      ) : (
                        <Gamepad2 className="size-12 text-muted-foreground/30" aria-hidden="true" />
                      )}
                    </div>
                    <span className="mt-3 text-xs font-medium text-primary">{d.manufacturer}</span>
                    <span className="font-semibold leading-tight group-hover:text-primary">{d.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} RetroWiki
        </div>
      </footer>
    </div>
  );
}
