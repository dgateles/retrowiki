import Image from "next/image";
import { Check, X, Cpu, Monitor, Gamepad2, Wifi } from "lucide-react";
import type { DeviceDetail } from "@/lib/devices";

function emuLevel(score: number) {
  if (score >= 95) return { label: "Excelente", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" };
  if (score >= 75) return { label: "Bom", cls: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30" };
  if (score >= 50) return { label: "Jogável", cls: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30" };
  return { label: "Ruim", cls: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30" };
}

function SpecRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{String(value)}</dd>
    </div>
  );
}

function Feature({ label, on }: { label: string; on: boolean | null | undefined }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium ${
        on
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-border bg-muted/50 text-muted-foreground"
      }`}
    >
      {on ? <Check className="size-3" aria-hidden="true" /> : <X className="size-3" aria-hidden="true" />}
      {label}
    </span>
  );
}

export function DeviceSpecCard({ detail }: { detail: DeviceDetail }) {
  const { device, spec, emulation, images } = detail;
  const extra = (device.extra ?? {}) as {
    description?: string;
    priceRange?: string;
    pros?: { text: string }[] | string[];
    cons?: { text: string }[] | string[];
  };
  const front = images[0];
  const pros = (extra.pros ?? []).map((p) => (typeof p === "string" ? p : p.text));
  const cons = (extra.cons ?? []).map((c) => (typeof c === "string" ? c : c.text));

  return (
    <div className="space-y-6">
      <section className="flex flex-col items-center gap-5 rounded-xl border border-border bg-card p-5 md:flex-row md:items-start">
        <div className="relative flex size-44 shrink-0 items-center justify-center">
          {front ? (
            <Image
              src={front.url}
              alt={front.alt}
              width={176}
              height={176}
              className="object-contain drop-shadow"
              priority
            />
          ) : (
            <Gamepad2 className="size-20 text-muted-foreground/40" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <p className="text-xs font-medium text-primary">
            {device.manufacturer}
            {device.releaseYear ? ` · ${device.releaseYear}` : ""}
          </p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">{device.name}</h1>
          {extra.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {extra.description}
            </p>
          )}
          {extra.priceRange && (
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">Preço aproximado: </span>
              {extra.priceRange}
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {spec && (
          <section aria-labelledby="ficha-hardware" className="rounded-lg border border-border bg-card p-5">
            <h2 id="ficha-hardware" className="mb-3 inline-flex items-center gap-2 text-base font-semibold">
              <Cpu className="size-4 text-primary" aria-hidden="true" /> Hardware
            </h2>
            <dl>
              <SpecRow label="Chip" value={spec.chip} />
              <SpecRow label="GPU" value={spec.gpu} />
              <SpecRow label="RAM" value={spec.ramGb ? `${spec.ramGb} GB${spec.ramType ? ` ${spec.ramType}` : ""}` : null} />
              <SpecRow label="Armazenamento" value={spec.storage} />
              <SpecRow label="Bateria" value={spec.batteryMah ? `${spec.batteryMah} mAh` : null} />
              <SpecRow label="Sistema" value={spec.os} />
            </dl>
          </section>
        )}

        {spec && (
          <section aria-labelledby="ficha-tela" className="rounded-lg border border-border bg-card p-5">
            <h2 id="ficha-tela" className="mb-3 inline-flex items-center gap-2 text-base font-semibold">
              <Monitor className="size-4 text-primary" aria-hidden="true" /> Tela e formato
            </h2>
            <dl>
              <SpecRow label="Tamanho" value={spec.screenSize ? `${spec.screenSize}"` : null} />
              <SpecRow label="Resolução" value={spec.resolution} />
              <SpecRow label="Proporção" value={spec.aspectRatio} />
              <SpecRow label="Painel" value={spec.panelType} />
              <SpecRow label="Atualização" value={spec.refreshHz ? `${spec.refreshHz} Hz` : null} />
              <SpecRow label="Formato" value={device.formFactor} />
            </dl>
          </section>
        )}
      </div>

      {spec && (
        <section aria-labelledby="ficha-conect" className="rounded-lg border border-border bg-card p-5">
          <h2 id="ficha-conect" className="mb-3 inline-flex items-center gap-2 text-base font-semibold">
            <Wifi className="size-4 text-primary" aria-hidden="true" /> Conectividade e controles
          </h2>
          <div className="flex flex-wrap gap-2">
            <Feature label="Wi-Fi" on={spec.wifi} />
            <Feature label="Bluetooth" on={spec.bluetooth} />
            <Feature label="Saída de vídeo" on={spec.videoOut} />
            <Feature label="USB-C" on={spec.usbC} />
            <Feature label="Cartão SD" on={spec.sdCard} />
            <Feature label="Analógicos" on={spec.analogs} />
            <Feature label="Hall Effect" on={spec.hallEffect} />
            <Feature label="L2/R2" on={spec.l2r2} />
            <Feature label="Touch" on={spec.touchScreen} />
            <Feature label="Giroscópio" on={spec.gyroscope} />
          </div>
        </section>
      )}

      {emulation.length > 0 && (
        <section aria-labelledby="ficha-emu" className="rounded-lg border border-border bg-card p-5">
          <h2 id="ficha-emu" className="mb-3 inline-flex items-center gap-2 text-base font-semibold">
            <Gamepad2 className="size-4 text-primary" aria-hidden="true" /> Emulação por sistema
          </h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {emulation.map((e) => {
              const lv = emuLevel(e.score);
              return (
                <li
                  key={e.system}
                  className={`flex items-center justify-between rounded-md border px-2.5 py-2 text-xs ${lv.cls}`}
                >
                  <span className="font-medium text-foreground">{e.system}</span>
                  <span className="font-semibold">{lv.label}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {(pros.length > 0 || cons.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {pros.length > 0 && (
            <section aria-labelledby="ficha-pros" className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5">
              <h2 id="ficha-pros" className="mb-2 font-semibold text-emerald-600 dark:text-emerald-400">Prós</h2>
              <ul className="space-y-1.5 text-sm">
                {pros.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {cons.length > 0 && (
            <section aria-labelledby="ficha-cons" className="rounded-lg border border-red-500/30 bg-red-500/5 p-5">
              <h2 id="ficha-cons" className="mb-2 font-semibold text-red-600 dark:text-red-400">Contras</h2>
              <ul className="space-y-1.5 text-sm">
                {cons.map((c) => (
                  <li key={c} className="flex gap-2">
                    <X className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" />
                    {c}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
