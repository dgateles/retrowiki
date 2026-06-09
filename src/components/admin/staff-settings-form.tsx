"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveStaffSettingsAction } from "@/lib/actions/staff-actions";
import type { StaffSettings } from "@/lib/settings";

export function StaffSettingsForm({ initial }: { initial: StaffSettings }) {
  const [s, setS] = useState(initial);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    const res = await saveStaffSettingsAction(JSON.stringify(s));
    setPending(false);
    if (res.ok) toast.success("Configurações salvas."); else toast.error(res.error ?? "Falha.");
  }

  return (
    <div className="rule-form">
      <section className="rule-form__section">
        <label className="rule-form__check">
          <input type="checkbox" checked={s.showBadge} onChange={(e) => setS({ ...s, showBadge: e.target.checked })} /> Mostrar selo de staff no conteúdo (moderadores e admins identificados em guias)
        </label>
        <div className="field">
          <Label htmlFor="st-prune">Expurgar o log de moderação após (dias; 0 = nunca)</Label>
          <Input id="st-prune" type="number" min={0} className="w-32" value={String(s.logPruneDays)} onChange={(e) => setS({ ...s, logPruneDays: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
        </div>
      </section>
      <div className="rule-form__foot">
        <Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
      </div>
    </div>
  );
}
