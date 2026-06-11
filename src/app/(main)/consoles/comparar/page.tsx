import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";
import { listDevices, getDeviceBySlug, type DeviceDetail } from "@/lib/devices";
import { FilterBar } from "@/components/catalog/filter-bar";

export const metadata: Metadata = {
  title: "Comparar consoles",
  description: "Compare specs e capacidade de emulação de handhelds retrô lado a lado.",
};

function emuLevel(score: number): { label: string; mod: string } {
  if (score >= 95) return { label: "Excelente", mod: "emu-pill--excellent" };
  if (score >= 75) return { label: "Bom", mod: "emu-pill--good" };
  if (score >= 50) return { label: "Jogável", mod: "emu-pill--playable" };
  return { label: "Ruim", mod: "emu-pill--poor" };
}

function specValue(d: DeviceDetail): Record<string, string> {
  const s = d.spec;
  const yn = (v: boolean | null | undefined) => (v ? "Sim" : "Não");
  return {
    Fabricante: d.device.manufacturer,
    Ano: d.device.releaseYear ? String(d.device.releaseYear) : "—",
    Formato: d.device.formFactor,
    CPU: s?.cpu ?? "—",
    GPU: s?.gpu ?? "—",
    RAM: s?.ramGb ? `${s.ramGb} GB` : "—",
    Armazenamento: s?.storage ?? "—",
    Bateria: s?.batteryMah ? `${s.batteryMah} mAh` : "—",
    Tela: s?.screenSize ? `${s.screenSize}" ${s.panelType ?? ""}`.trim() : "—",
    Resolução: s?.resolution ?? "—",
    Sistema: s?.os ?? "—",
    "Wi-Fi": yn(s?.wifi),
    Bluetooth: yn(s?.bluetooth),
    "Saída de vídeo": yn(s?.videoOut),
    "Hall Effect": yn(s?.hallEffect),
  };
}

const SPEC_KEYS = [
  "Fabricante", "Ano", "Formato", "CPU", "GPU", "RAM", "Armazenamento",
  "Bateria", "Tela", "Resolução", "Sistema", "Wi-Fi", "Bluetooth",
  "Saída de vídeo", "Hall Effect",
];

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; c?: string }>;
}) {
  const sp = await searchParams;
  const slots = [sp.a, sp.b, sp.c];
  const all = await listDevices();
  const options = all.map((d) => ({ value: d.slug, label: d.name }));

  const selected = (
    await Promise.all(slots.map((s) => (s ? getDeviceBySlug(s) : Promise.resolve(null))))
  ).filter((d): d is DeviceDetail => !!d);

  const systems: string[] = [];
  for (const d of selected) for (const e of d.emulation) if (!systems.includes(e.system)) systems.push(e.system);

  return (
    <main id="main" className="page">
      <h1 className="page__title">Comparar consoles</h1>

      <FilterBar
        path="/consoles/comparar"
        filters={[
          { name: "a", label: "Console 1", allLabel: "—", value: sp.a ?? "", options },
          { name: "b", label: "Console 2", allLabel: "—", value: sp.b ?? "", options },
          { name: "c", label: "Console 3", allLabel: "—", value: sp.c ?? "", options },
        ]}
      />

      {selected.length < 2 ? (
        <div className="empty mt-8">
          <GitCompare className="empty__icon" aria-hidden="true" />
          <p className="empty__text">
            Escolha pelo menos dois consoles acima para ver a comparação lado a lado.
          </p>
        </div>
      ) : (
        <div className="compare">
          <table className="compare__table">
            <caption className="sr-only">Comparação de especificações e emulação</caption>
            <thead>
              <tr>
                <th scope="col" className="compare__corner">
                  <span className="sr-only">Característica</span>
                </th>
                {selected.map((d) => (
                  <th key={d.device.id} scope="col" className="compare__device">
                    <Link href={`/consoles/${d.device.slug}`} className="compare__device-link">
                      {d.images[0] && (
                        <Image src={d.images[0].url} alt={d.images[0].alt} width={64} height={64} className="object-contain" />
                      )}
                      <span className="font-semibold">{d.device.name}</span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPEC_KEYS.map((key) => {
                const vals = selected.map((d) => specValue(d)[key] ?? "—");
                return (
                  <tr key={key} className="compare__row">
                    <th scope="row" className="compare__key">{key}</th>
                    {vals.map((v, i) => (
                      <td key={i} className="compare__val">{v}</td>
                    ))}
                  </tr>
                );
              })}
              {systems.length > 0 && (
                <tr>
                  <th scope="row" colSpan={selected.length + 1} className="compare__section">
                    Emulação
                  </th>
                </tr>
              )}
              {systems.map((sys) => (
                <tr key={sys} className="compare__row">
                  <th scope="row" className="compare__key">{sys}</th>
                  {selected.map((d) => {
                    const e = d.emulation.find((x) => x.system === sys);
                    if (!e) return <td key={d.device.id} className="compare__val text-muted-foreground">—</td>;
                    const lv = emuLevel(e.score);
                    return (
                      <td key={d.device.id} className="compare__val">
                        <span className={cn("emu-pill", lv.mod)}>{lv.label}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
