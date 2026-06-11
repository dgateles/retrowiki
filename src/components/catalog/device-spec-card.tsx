import Image from "next/image";
import { Check, X, Cpu, Monitor, Gamepad2, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DeviceDetail } from "@/lib/devices";

function emuLevel(score: number): { label: string; mod: string } {
  if (score >= 95) return { label: "Excelente", mod: "emu-pill--excellent" };
  if (score >= 75) return { label: "Bom", mod: "emu-pill--good" };
  if (score >= 50) return { label: "Jogável", mod: "emu-pill--playable" };
  return { label: "Ruim", mod: "emu-pill--poor" };
}

function SpecRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2.5 last:border-b-0">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{String(value)}</dd>
    </div>
  );
}

function Feature({ label, on }: { label: string; on: boolean | null | undefined }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 py-1", !on && "text-muted-foreground opacity-70")}>
      {on ? (
        <Check className="text-emerald-500" aria-hidden="true" />
      ) : (
        <X className="text-muted-foreground" aria-hidden="true" />
      )}
      {label}
    </Badge>
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
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <Card>
        <CardContent className="flex flex-col gap-6 pt-6 sm:flex-row sm:items-center">
          <div className="relative flex h-40 w-44 shrink-0 items-center justify-center self-center overflow-hidden rounded-xl bg-muted/40">
            {front ? (
              <Image src={front.url} alt={front.alt} fill sizes="176px" className="object-contain" priority />
            ) : (
              <Gamepad2 className="size-20 text-muted-foreground/30" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <Badge variant="secondary" className="font-mono text-[10px] tracking-wider uppercase">
              {device.manufacturer}
              {device.releaseYear ? ` · ${device.releaseYear}` : ""}
            </Badge>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{device.name}</h1>
            {extra.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{extra.description}</p>}
            {extra.priceRange && (
              <p className="mt-3 text-sm">
                <span className="text-muted-foreground">Preço aproximado: </span>
                <span className="font-mono font-semibold text-primary">{extra.priceRange}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {spec && (
          <section aria-labelledby="ficha-hardware">
            <Card className="h-full">
              <CardHeader>
                <h2 id="ficha-hardware" className="text-lg font-semibold leading-none flex items-center gap-2">
                  <Cpu className="size-4 text-primary" aria-hidden="true" /> Hardware
                </h2>
              </CardHeader>
              <CardContent>
                <dl>
                  <SpecRow label="CPU" value={spec.cpu} />
                  <SpecRow label="GPU" value={spec.gpu} />
                  <SpecRow label="RAM" value={spec.ramGb ? `${spec.ramGb} GB${spec.ramType ? ` ${spec.ramType}` : ""}` : null} />
                  <SpecRow label="Armazenamento" value={spec.storage} />
                  <SpecRow label="Bateria" value={spec.batteryMah ? `${spec.batteryMah} mAh` : null} />
                  <SpecRow label="Sistema" value={spec.os} />
                </dl>
              </CardContent>
            </Card>
          </section>
        )}

        {spec && (
          <section aria-labelledby="ficha-tela">
            <Card className="h-full">
              <CardHeader>
                <h2 id="ficha-tela" className="text-lg font-semibold leading-none flex items-center gap-2">
                  <Monitor className="size-4 text-primary" aria-hidden="true" /> Tela e formato
                </h2>
              </CardHeader>
              <CardContent>
                <dl>
                  <SpecRow label="Tamanho" value={spec.screenSize ? `${spec.screenSize}"` : null} />
                  <SpecRow label="Resolução" value={spec.resolution} />
                  <SpecRow label="Proporção" value={spec.aspectRatio} />
                  <SpecRow label="Painel" value={spec.panelType} />
                  <SpecRow label="Atualização" value={spec.refreshHz ? `${spec.refreshHz} Hz` : null} />
                  <SpecRow label="Formato" value={device.formFactor} />
                </dl>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {spec && (
        <section aria-labelledby="ficha-conect">
          <Card>
            <CardHeader>
              <h2 id="ficha-conect" className="text-lg font-semibold leading-none flex items-center gap-2">
                <Wifi className="size-4 text-primary" aria-hidden="true" /> Conectividade e controles
              </h2>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
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
            </CardContent>
          </Card>
        </section>
      )}

      {emulation.length > 0 && (
        <section aria-labelledby="ficha-emu">
          <Card>
            <CardHeader>
              <h2 id="ficha-emu" className="text-lg font-semibold leading-none flex items-center gap-2">
                <Gamepad2 className="size-4 text-primary" aria-hidden="true" /> Emulação por sistema
              </h2>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {emulation.map((e) => {
                  const lv = emuLevel(e.score);
                  return (
                    <li key={e.system} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                      <span className="min-w-0 truncate text-sm font-medium">{e.system}</span>
                      <span className={cn("emu-pill", lv.mod)}>{lv.label}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      {(pros.length > 0 || cons.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {pros.length > 0 && (
            <section aria-labelledby="ficha-pros">
              <Card className="h-full border-emerald-500/30 bg-emerald-500/[0.04]">
                <CardHeader>
                  <h2 id="ficha-pros" className="text-lg font-semibold leading-none text-emerald-600 dark:text-emerald-400">Prós</h2>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-2.5">
                    {pros.map((p) => (
                      <li key={p} className="flex gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}
          {cons.length > 0 && (
            <section aria-labelledby="ficha-cons">
              <Card className="h-full border-red-500/30 bg-red-500/[0.04]">
                <CardHeader>
                  <h2 id="ficha-cons" className="text-lg font-semibold leading-none text-red-600 dark:text-red-400">Contras</h2>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-2.5">
                    {cons.map((c) => (
                      <li key={c} className="flex gap-2 text-sm">
                        <X className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
