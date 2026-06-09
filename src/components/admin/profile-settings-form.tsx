"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProfileSettingsAction } from "@/lib/actions/profile-field-actions";

export function ProfileSettingsForm({ initial }: { initial: { nameMin: number; nameMax: number } }) {
  const [nameMin, setNameMin] = useState(String(initial.nameMin));
  const [nameMax, setNameMax] = useState(String(initial.nameMax));
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    const res = await saveProfileSettingsAction(JSON.stringify({ nameMin: Number(nameMin), nameMax: Number(nameMax) }));
    setPending(false);
    if (res.ok) toast.success("Configurações salvas."); else toast.error(res.error ?? "Falha.");
  }

  return (
    <div className="rule-form">
      <section className="rule-form__section">
        <h2 className="rule-form__title">Nome de exibição</h2>
        <div className="field">
          <Label>Tamanho permitido (caracteres)</Label>
          <div className="pf-inline">
            <Input type="number" min={1} className="w-24" value={nameMin} onChange={(e) => setNameMin(e.target.value)} aria-label="Mínimo" />
            <span className="muted">a</span>
            <Input type="number" min={2} className="w-24" value={nameMax} onChange={(e) => setNameMax(e.target.value)} aria-label="Máximo" />
          </div>
        </div>
      </section>
      <div className="rule-form__foot">
        <Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
      </div>
    </div>
  );
}
