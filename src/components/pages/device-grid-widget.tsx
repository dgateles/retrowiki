"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gamepad2, ArrowRight } from "lucide-react";
import { DeviceCard } from "@/components/catalog/device-card";
import { DeviceGridSkeleton } from "@/components/skeletons";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

type DeviceItem = { slug: string; name: string; manufacturer: string; frontImage: string | null };

/** Widget dinâmico: grade de consoles puxada do catálogo publicado em tempo real.
 *  Busca no cliente para funcionar igual na página publicada e na prévia do editor. */
export function DeviceGridWidget({ title, limit, showAll }: { title: string; limit: number; showAll: boolean }) {
  const [devices, setDevices] = useState<DeviceItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/devices")
      .then((r) => (r.ok ? r.json() : { devices: [] }))
      .then((d: { devices: DeviceItem[] }) => { if (alive) setDevices(d.devices ?? []); })
      .catch(() => { if (alive) setDevices([]); });
    return () => { alive = false; };
  }, []);

  const shown = devices && limit > 0 ? devices.slice(0, limit) : devices;

  return (
    <section aria-labelledby="dg-title" className="w-full">
      <div className="page__head">
        <h2 id="dg-title" className="section-title">{title}</h2>
        {showAll && (
          <Link href="/consoles" className="section-link">
            Ver todos <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {shown === null ? (
        <DeviceGridSkeleton count={limit > 0 ? Math.min(limit, 9) : 6} />
      ) : shown.length === 0 ? (
        <Empty className="mt-6">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Gamepad2 aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>Catálogo vazio</EmptyTitle>
            <EmptyDescription>Os consoles aparecerão aqui assim que forem cadastrados.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid-cards mt-6">
          {shown.map((d) => (
            <li key={d.slug}>
              <DeviceCard slug={d.slug} name={d.name} manufacturer={d.manufacturer} frontImage={d.frontImage} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
