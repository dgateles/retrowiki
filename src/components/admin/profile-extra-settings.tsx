"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingGroup, SettingToggle } from "@/components/admin/setting-toggle";
import { saveGallerySettingsAction, saveProfileCompletionSettingsAction } from "@/lib/actions/gallery-actions";
import type { GallerySettings, ProfileCompletionSettings } from "@/lib/settings";

export function GallerySettingsForm({ initial }: { initial: GallerySettings }) {
  const [s, setS] = useState(initial);
  const [pending, setPending] = useState(false);
  async function save() {
    setPending(true);
    const res = await saveGallerySettingsAction(JSON.stringify(s));
    setPending(false);
    if (res.ok) toast.success("Configurações salvas."); else toast.error(res.error ?? "Falha.");
  }
  return (
    <div className="rule-form">
      <section className="rule-form__section">
        <SettingGroup>
          <SettingToggle label="Permitir galeria de fotos no perfil dos membros" checked={s.enabled} onCheckedChange={(c) => setS({ ...s, enabled: c })} />
        </SettingGroup>
        <div className="field">
          <Label htmlFor="g-max">Máximo de fotos por membro</Label>
          <Input id="g-max" type="number" min={1} max={100} className="w-32" value={String(s.maxPhotos)} onChange={(e) => setS({ ...s, maxPhotos: Math.max(1, Math.min(100, Math.floor(Number(e.target.value) || 1))) })} />
        </div>
      </section>
      <div className="rule-form__foot"><Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button></div>
    </div>
  );
}

export function ProfileCompletionSettingsForm({ initial }: { initial: ProfileCompletionSettings }) {
  const [s, setS] = useState(initial);
  const [pending, setPending] = useState(false);
  async function save() {
    setPending(true);
    const res = await saveProfileCompletionSettingsAction(JSON.stringify(s));
    setPending(false);
    if (res.ok) toast.success("Configurações salvas."); else toast.error(res.error ?? "Falha.");
  }
  return (
    <div className="rule-form">
      <section className="rule-form__section">
        <p className="muted text-sm">Exibe um aviso no painel do membro até ele completar o perfil.</p>
        <SettingGroup>
          <SettingToggle label="Mostrar o aviso de conclusão de perfil" checked={s.enabled} onCheckedChange={(c) => setS({ ...s, enabled: c })} />
          <SettingToggle label="Exigir avatar" checked={s.requireAvatar} onCheckedChange={(c) => setS({ ...s, requireAvatar: c })} />
          <SettingToggle label="Exigir os campos de perfil editáveis preenchidos" checked={s.requireFields} onCheckedChange={(c) => setS({ ...s, requireFields: c })} />
        </SettingGroup>
      </section>
      <div className="rule-form__foot"><Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button></div>
    </div>
  );
}
