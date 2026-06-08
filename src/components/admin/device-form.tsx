"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListEditor, EmulationEditor, type EmuRow } from "@/components/admin/field-editors";
import { createDeviceAction, updateDeviceAction } from "@/lib/actions/admin-actions";
import type { DeviceFormValues } from "@/lib/admin/device-schema";

const FEATURES: { key: keyof DeviceFormValues["spec"]; label: string }[] = [
  { key: "wifi", label: "Wi-Fi" },
  { key: "bluetooth", label: "Bluetooth" },
  { key: "videoOut", label: "Saída de vídeo" },
  { key: "audioJack", label: "Fone P2" },
  { key: "usbC", label: "USB-C" },
  { key: "sdCard", label: "Cartão SD" },
  { key: "analogs", label: "Analógicos" },
  { key: "hallEffect", label: "Hall Effect" },
  { key: "analogTriggers", label: "Gatilhos analógicos" },
  { key: "l1r1", label: "L1/R1" },
  { key: "l2r2", label: "L2/R2" },
  { key: "l3r3", label: "L3/R3" },
  { key: "touchScreen", label: "Touch" },
  { key: "gyroscope", label: "Giroscópio" },
  { key: "cooling", label: "Cooler ativo" },
  { key: "vibration", label: "Vibração" },
];

const SPEC_FIELDS: [keyof SpecState, string][] = [
  ["cpu", "CPU"], ["gpu", "GPU"], ["ramGb", "RAM (GB)"], ["ramType", "Tipo de RAM"],
  ["storage", "Armazenamento"], ["os", "Sistema"], ["screenSize", "Tela (pol)"],
  ["resolution", "Resolução"], ["aspectRatio", "Proporção"], ["refreshHz", "Atualização (Hz)"],
  ["panelType", "Painel"], ["batteryMah", "Bateria (mAh)"],
];

type SpecState = {
  cpu: string; gpu: string; ramGb: string; ramType: string; storage: string; os: string;
  screenSize: string; resolution: string; aspectRatio: string; refreshHz: string;
  panelType: string; batteryMah: string;
};

type Props = { initial?: DeviceFormValues & { id: number } };

const numToStr = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));
const strToNum = (s: string) => (s.trim() === "" ? null : Number(s));

export function DeviceForm({ initial }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const [core, setCore] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    manufacturer: initial?.manufacturer ?? "",
    releaseYear: numToStr(initial?.releaseYear),
    priceUsd: numToStr(initial?.priceUsd),
    formFactor: String(initial?.formFactor ?? "vertical"),
    status: String(initial?.status ?? "published"),
    description: initial?.description ?? "",
    priceRange: initial?.priceRange ?? "",
    frontImageUrl: initial?.frontImageUrl ?? "",
    frontImageAlt: initial?.frontImageAlt ?? "",
  });
  const [pros, setPros] = useState<string[]>(initial?.pros ?? []);
  const [cons, setCons] = useState<string[]>(initial?.cons ?? []);
  const [emulation, setEmulation] = useState<EmuRow[]>(initial?.emulation ?? []);
  const [spec, setSpec] = useState<SpecState>(() => ({
    cpu: initial?.spec.cpu ?? "",
    gpu: initial?.spec.gpu ?? "",
    ramGb: numToStr(initial?.spec.ramGb),
    ramType: initial?.spec.ramType ?? "",
    storage: initial?.spec.storage ?? "",
    os: initial?.spec.os ?? "",
    screenSize: numToStr(initial?.spec.screenSize),
    resolution: initial?.spec.resolution ?? "",
    aspectRatio: initial?.spec.aspectRatio ?? "",
    refreshHz: numToStr(initial?.spec.refreshHz),
    panelType: initial?.spec.panelType ?? "",
    batteryMah: numToStr(initial?.spec.batteryMah),
  }));
  const [features, setFeatures] = useState<Record<string, boolean>>(() => {
    const f: Record<string, boolean> = {};
    for (const { key } of FEATURES) f[key] = Boolean(initial?.spec[key]);
    return f;
  });

  const setSpecField = (k: keyof SpecState, v: string) => setSpec((s) => ({ ...s, [k]: v }));

  function buildPayload() {
    return {
      name: core.name,
      slug: core.slug,
      manufacturer: core.manufacturer,
      releaseYear: strToNum(core.releaseYear),
      priceUsd: strToNum(core.priceUsd),
      formFactor: core.formFactor as DeviceFormValues["formFactor"],
      status: core.status as DeviceFormValues["status"],
      description: core.description,
      priceRange: core.priceRange,
      pros: pros.map((p) => p.trim()).filter(Boolean),
      cons: cons.map((c) => c.trim()).filter(Boolean),
      frontImageUrl: core.frontImageUrl,
      frontImageAlt: core.frontImageAlt,
      emulation: emulation
        .map((e) => ({ system: e.system.trim(), score: e.score }))
        .filter((e) => e.system && Number.isFinite(e.score)),
      spec: {
        cpu: spec.cpu, gpu: spec.gpu,
        ramGb: strToNum(spec.ramGb), ramType: spec.ramType, storage: spec.storage, os: spec.os,
        screenSize: strToNum(spec.screenSize), resolution: spec.resolution,
        aspectRatio: spec.aspectRatio, refreshHz: strToNum(spec.refreshHz), panelType: spec.panelType,
        batteryMah: strToNum(spec.batteryMah),
        ...Object.fromEntries(FEATURES.map(({ key }) => [key, features[key]])),
      },
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const payload = buildPayload();
    const res = initial
      ? await updateDeviceAction(initial.id, payload)
      : await createDeviceAction(payload);
    setPending(false);
    if (res.ok) {
      toast.success(initial ? "Console atualizado." : "Console criado.");
      router.push("/admin/consoles");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin-form">
      <fieldset className="admin-form__section">
        <legend className="admin-form__legend">Básico</legend>
        <div className="admin-form__grid">
          <div className="field">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={core.name} onChange={(e) => setCore({ ...core, name: e.target.value })} required />
          </div>
          <div className="field">
            <Label htmlFor="manufacturer">Fabricante</Label>
            <Input id="manufacturer" value={core.manufacturer} onChange={(e) => setCore({ ...core, manufacturer: e.target.value })} required />
          </div>
          <div className="field">
            <Label htmlFor="slug">Slug (opcional)</Label>
            <Input id="slug" value={core.slug} onChange={(e) => setCore({ ...core, slug: e.target.value })} placeholder="gerado pelo nome" />
          </div>
          <div className="field">
            <Label htmlFor="year">Ano</Label>
            <Input id="year" type="number" value={core.releaseYear} onChange={(e) => setCore({ ...core, releaseYear: e.target.value })} />
          </div>
          <div className="field">
            <Label htmlFor="price">Preço (USD)</Label>
            <Input id="price" type="number" value={core.priceUsd} onChange={(e) => setCore({ ...core, priceUsd: e.target.value })} />
          </div>
          <div className="field">
            <Label htmlFor="form">Formato</Label>
            <select id="form" aria-label="Formato" className="editor__select editor__select--full" value={core.formFactor} onChange={(e) => setCore({ ...core, formFactor: e.target.value })}>
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
              <option value="clamshell">Clamshell</option>
              <option value="other">Outro</option>
            </select>
          </div>
          <div className="field">
            <Label htmlFor="status">Status</Label>
            <select id="status" aria-label="Status" className="editor__select editor__select--full" value={core.status} onChange={(e) => setCore({ ...core, status: e.target.value })}>
              <option value="published">Publicado</option>
              <option value="draft">Rascunho</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>
          <div className="field">
            <Label htmlFor="priceRange">Faixa de preço (texto)</Label>
            <Input id="priceRange" value={core.priceRange} onChange={(e) => setCore({ ...core, priceRange: e.target.value })} placeholder="ex.: entre R$400 e R$500" />
          </div>
        </div>
        <div className="field mt-3">
          <Label htmlFor="desc">Descrição</Label>
          <textarea id="desc" rows={3} aria-label="Descrição" className="editor__control" value={core.description} onChange={(e) => setCore({ ...core, description: e.target.value })} />
        </div>
      </fieldset>

      <fieldset className="admin-form__section">
        <legend className="admin-form__legend">Imagem frontal</legend>
        <div className="admin-form__grid">
          <div className="field">
            <Label htmlFor="img">URL da imagem</Label>
            <Input id="img" value={core.frontImageUrl} onChange={(e) => setCore({ ...core, frontImageUrl: e.target.value })} placeholder="https://…" />
          </div>
          <div className="field">
            <Label htmlFor="imgAlt">Texto alternativo</Label>
            <Input id="imgAlt" value={core.frontImageAlt} onChange={(e) => setCore({ ...core, frontImageAlt: e.target.value })} />
          </div>
        </div>
      </fieldset>

      <fieldset className="admin-form__section">
        <legend className="admin-form__legend">Especificações</legend>
        <div className="admin-form__grid">
          {SPEC_FIELDS.map(([k, label]) => (
            <div key={k} className="field">
              <Label htmlFor={`spec-${k}`}>{label}</Label>
              <Input id={`spec-${k}`} value={spec[k]} onChange={(e) => setSpecField(k, e.target.value)} />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="admin-form__section">
        <legend className="admin-form__legend">Recursos</legend>
        <div className="admin-form__features">
          {FEATURES.map(({ key, label }) => (
            <label key={key} className="editor__check">
              <input
                type="checkbox"
                checked={features[key]}
                onChange={(e) => setFeatures((f) => ({ ...f, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="admin-form__section">
        <EmulationEditor items={emulation} onChange={setEmulation} />
      </div>

      <div className="admin-form__section admin-form__grid">
        <ListEditor legend="Prós" items={pros} onChange={setPros} placeholder="Ponto positivo" />
        <ListEditor legend="Contras" items={cons} onChange={setCons} placeholder="Ponto negativo" />
      </div>

      <div className="btn-row">
        <Button type="submit" disabled={pending || core.name.trim().length < 2}>
          {pending ? "Salvando…" : initial ? "Salvar alterações" : "Criar console"}
        </Button>
      </div>
    </form>
  );
}
