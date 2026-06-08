import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { listDevices, getDeviceBySlug, type DeviceDetail } from "@/lib/devices";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Comparar consoles",
  description: "Compare specs e capacidade de emulação de handhelds retrô lado a lado.",
};

function emuLabel(score: number) {
  if (score >= 95) return "Excelente";
  if (score >= 75) return "Bom";
  if (score >= 50) return "Jogável";
  return "Ruim";
}

function specValue(d: DeviceDetail): Record<string, string> {
  const s = d.spec;
  const yn = (v: boolean | null | undefined) => (v ? "Sim" : "Não");
  return {
    Fabricante: d.device.manufacturer,
    Ano: d.device.releaseYear ? String(d.device.releaseYear) : "—",
    Formato: d.device.formFactor,
    Chip: s?.chip ?? "—",
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
  "Fabricante", "Ano", "Formato", "Chip", "GPU", "RAM", "Armazenamento",
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

  const selected = (
    await Promise.all(slots.map((s) => (s ? getDeviceBySlug(s) : Promise.resolve(null))))
  ).filter((d): d is DeviceDetail => !!d);

  // emulação: união de sistemas presentes
  const systems: string[] = [];
  for (const d of selected) for (const e of d.emulation) if (!systems.includes(e.system)) systems.push(e.system);

  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold">Comparar consoles</h1>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3" aria-label="Selecionar consoles para comparar">
        {(["a", "b", "c"] as const).map((slot, i) => (
          <div key={slot} className="flex flex-col gap-1.5">
            <label htmlFor={`slot-${slot}`} className="text-sm font-medium">
              Console {i + 1}
            </label>
            <select
              id={`slot-${slot}`}
              name={slot}
              defaultValue={slots[i] ?? ""}
              className="h-10 min-w-44 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <option value="">—</option>
              {all.map((d) => (
                <option key={d.id} value={d.slug}>{d.name}</option>
              ))}
            </select>
          </div>
        ))}
        <Button type="submit" size="sm">Comparar</Button>
      </form>

      {selected.length < 2 ? (
        <p className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Escolha pelo menos dois consoles para ver a comparação.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Comparação de especificações e emulação</caption>
            <thead>
              <tr>
                <th scope="col" className="border-b border-border px-3 py-2 text-left">
                  <span className="sr-only">Característica</span>
                </th>
                {selected.map((d) => (
                  <th key={d.device.id} scope="col" className="border-b border-border px-3 py-3 text-left align-bottom">
                    <Link href={`/consoles/${d.device.slug}`} className="flex flex-col items-start gap-2 hover:text-primary">
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
                  <tr key={key} className="border-b border-border/60">
                    <th scope="row" className="px-3 py-2 text-left font-medium text-muted-foreground">{key}</th>
                    {vals.map((v, i) => (
                      <td key={i} className="px-3 py-2">{v}</td>
                    ))}
                  </tr>
                );
              })}
              {systems.length > 0 && (
                <tr>
                  <th scope="row" colSpan={selected.length + 1} className="bg-muted/40 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Emulação
                  </th>
                </tr>
              )}
              {systems.map((sys) => (
                <tr key={sys} className="border-b border-border/60">
                  <th scope="row" className="px-3 py-2 text-left font-medium text-muted-foreground">{sys}</th>
                  {selected.map((d) => {
                    const e = d.emulation.find((x) => x.system === sys);
                    return <td key={d.device.id} className="px-3 py-2">{e ? emuLabel(e.score) : "—"}</td>;
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
