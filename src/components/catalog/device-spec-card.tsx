import Image from "next/image";
import { Check, X, Cpu, Monitor, Gamepad2, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeviceDetail } from "@/lib/devices";

function emuLevel(score: number): { label: string; mod: string } {
  if (score >= 95) return { label: "Excelente", mod: "emu--excellent" };
  if (score >= 75) return { label: "Bom", mod: "emu--good" };
  if (score >= 50) return { label: "Jogável", mod: "emu--playable" };
  return { label: "Ruim", mod: "emu--poor" };
}

function SpecRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="spec__row">
      <dt className="spec__row-label">{label}</dt>
      <dd className="spec__row-value">{String(value)}</dd>
    </div>
  );
}

function Feature({ label, on }: { label: string; on: boolean | null | undefined }) {
  return (
    <span className={cn("feature", on ? "feature--on" : "feature--off")}>
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
    <div className="spec">
      <section className="spec__hero">
        <div className="spec__media">
          {front ? (
            <Image src={front.url} alt={front.alt} fill sizes="176px" className="spec__img" priority />
          ) : (
            <span className="spec__placeholder">
              <Gamepad2 className="size-20" aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="spec__intro">
          <p className="spec__brand">
            {device.manufacturer}
            {device.releaseYear ? ` · ${device.releaseYear}` : ""}
          </p>
          <h1 className="spec__name">{device.name}</h1>
          {extra.description && <p className="spec__desc">{extra.description}</p>}
          {extra.priceRange && (
            <p className="spec__price">
              <span className="spec__row-label">Preço aproximado: </span>
              {extra.priceRange}
            </p>
          )}
        </div>
      </section>

      <div className="spec__cols">
        {spec && (
          <section aria-labelledby="ficha-hardware" className="spec__section">
            <h2 id="ficha-hardware" className="spec__section-title">
              <Cpu aria-hidden="true" /> Hardware
            </h2>
            <dl>
              <SpecRow label="CPU" value={spec.cpu} />
              <SpecRow label="GPU" value={spec.gpu} />
              <SpecRow label="RAM" value={spec.ramGb ? `${spec.ramGb} GB${spec.ramType ? ` ${spec.ramType}` : ""}` : null} />
              <SpecRow label="Armazenamento" value={spec.storage} />
              <SpecRow label="Bateria" value={spec.batteryMah ? `${spec.batteryMah} mAh` : null} />
              <SpecRow label="Sistema" value={spec.os} />
            </dl>
          </section>
        )}

        {spec && (
          <section aria-labelledby="ficha-tela" className="spec__section">
            <h2 id="ficha-tela" className="spec__section-title">
              <Monitor aria-hidden="true" /> Tela e formato
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
        <section aria-labelledby="ficha-conect" className="spec__section">
          <h2 id="ficha-conect" className="spec__section-title">
            <Wifi aria-hidden="true" /> Conectividade e controles
          </h2>
          <div className="spec__features">
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
        <section aria-labelledby="ficha-emu" className="spec__section">
          <h2 id="ficha-emu" className="spec__section-title">
            <Gamepad2 aria-hidden="true" /> Emulação por sistema
          </h2>
          <ul className="emu-grid">
            {emulation.map((e) => {
              const lv = emuLevel(e.score);
              return (
                <li key={e.system} className={cn("emu", lv.mod)}>
                  <span className="emu__system">{e.system}</span>
                  <span className="emu__level">{lv.label}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {(pros.length > 0 || cons.length > 0) && (
        <div className="proscons">
          {pros.length > 0 && (
            <section aria-labelledby="ficha-pros" className="pros">
              <h2 id="ficha-pros" className="pros__title">Prós</h2>
              <ul className="proscons__list">
                {pros.map((p) => (
                  <li key={p} className="proscons__item">
                    <Check className="icon-pos" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {cons.length > 0 && (
            <section aria-labelledby="ficha-cons" className="cons">
              <h2 id="ficha-cons" className="cons__title">Contras</h2>
              <ul className="proscons__list">
                {cons.map((c) => (
                  <li key={c} className="proscons__item">
                    <X className="icon-neg" aria-hidden="true" />
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
