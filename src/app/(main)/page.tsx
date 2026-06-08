import Link from "next/link";
import Image from "next/image";
import { Gamepad2, ArrowRight, GitCompare } from "lucide-react";
import { listDevices } from "@/lib/devices";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const devices = await listDevices();

  return (
    <div className="home">
      <main id="main" className="flex-1">
        {/* Hero compacto */}
        <section className="hero">
          <div className="hero__inner">
            <p className="hero__eyebrow">Comunidade de handhelds retrô</p>
            <h1 className="hero__title">
              O catálogo e os guias de emulação portátil, feitos pela comunidade
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
            <p className="empty">O catálogo será populado pelo seed.</p>
          ) : (
            <ul className="grid-cards">
              {devices.map((d) => (
                <li key={d.id}>
                  <Link href={`/consoles/${d.slug}`} className="device-card">
                    <span className="device-card__media">
                      {d.frontImage ? (
                        <Image src={d.frontImage} alt={`${d.name}, vista frontal`} fill sizes="160px" className="device-card__img" />
                      ) : (
                        <Gamepad2 className="device-card__placeholder" aria-hidden="true" />
                      )}
                    </span>
                    <span className="device-card__brand">{d.manufacturer}</span>
                    <span className="device-card__name">{d.name}</span>
                  </Link>
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
