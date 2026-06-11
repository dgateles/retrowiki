import Link from "next/link";
import { Gamepad2, ArrowRight, GitCompare } from "lucide-react";
import { listDevices } from "@/lib/devices";
import { Button } from "@/components/ui/button";
import { DeviceCard } from "@/components/catalog/device-card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

export default async function HomePage() {
  const devices = await listDevices();

  return (
    <div className="home">
      <main id="main" className="flex-1">
        {/* Hero compacto */}
        <section className="hero scanlines">
          <div className="hero__inner">
            <p className="hero__eyebrow glow-box">Comunidade de handhelds retrô</p>
            <h1 className="hero__title">
              O catálogo e os guias de emulação portátil,{" "}
              <span className="text-primary glow-text">feitos pela comunidade</span>
            </h1>
            <p className="hero__lead">
              Fichas técnicas, comparador, tutoriais e firmware num só lugar, com curadoria.
            </p>
            <div className="hero__actions">
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
        <section aria-labelledby="consoles" className="page">
          <div className="page__head">
            <h2 id="consoles" className="section-title">Consoles</h2>
            <Link href="/consoles" className="section-link">
              Ver todos <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {devices.length === 0 ? (
            <Empty className="mt-6">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Gamepad2 aria-hidden="true" /></EmptyMedia>
                <EmptyTitle>Catálogo vazio</EmptyTitle>
                <EmptyDescription>Os consoles aparecerão aqui assim que forem cadastrados.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="grid-cards">
              {devices.map((d) => (
                <li key={d.id}>
                  <DeviceCard slug={d.slug} name={d.name} manufacturer={d.manufacturer} frontImage={d.frontImage} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">© {new Date().getFullYear()} RetroWiki</div>
      </footer>
    </div>
  );
}
