"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NOTIFICATION_CATEGORIES, type NotificationsConfig, type ChannelMode } from "@/lib/notifications-config";
import { saveNotificationsConfigAction, resetAllMemberPrefsAction } from "@/lib/actions/notification-config-actions";

const MODES: { value: ChannelMode; label: string }[] = [
  { value: "default_on", label: "Ligado por padrão" },
  { value: "default_off", label: "Desligado por padrão" },
  { value: "disabled", label: "Desabilitado" },
];

export function NotificationsConfigForm({ config: initial }: { config: NotificationsConfig }) {
  const router = useRouter();
  const [config, setConfig] = useState<NotificationsConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  function set(key: string, patch: Partial<NotificationsConfig[string]>) {
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  async function save() {
    setSaving(true);
    const res = await saveNotificationsConfigAction(JSON.stringify(config));
    setSaving(false);
    if (res.ok) toast.success("Configurações salvas."); else toast.error(res.error ?? "Falha.");
  }

  async function reset() {
    if (!window.confirm("Isto apaga as preferências de notificação de todos os membros, voltando aos padrões. Continuar?")) return;
    setResetting(true);
    const res = await resetAllMemberPrefsAction();
    setResetting(false);
    if (res.ok) { toast.success("Preferências redefinidas."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <div className="mt-6">
      <div className="pf-toolbar">
        <Button variant="outline" size="sm" onClick={reset} disabled={resetting}>
          {resetting ? "Redefinindo…" : "Redefinir todos os membros aos padrões"}
        </Button>
      </div>

      <ul className="pf-groups mt-4">
        {NOTIFICATION_CATEGORIES.map((cat) => {
          const c = config[cat.key];
          if (!c) return null;
          return (
            <li key={cat.key} className="pf-group">
              <div className="notif-cfg">
                <div>
                  <h2 className="pf-group__name">{cat.label}</h2>
                  <p className="pf-field__meta">{cat.description}</p>
                </div>
                <div className="notif-cfg__controls">
                  <label className="rule-form__check">
                    <input type="checkbox" checked={c.memberEditable} onChange={(e) => set(cat.key, { memberEditable: e.target.checked })} /> Membro pode editar
                  </label>
                  <div className="notif-cfg__channel">
                    <Label>Sino (in-app)</Label>
                    <select className="rte__select" value={c.inApp} onChange={(e) => set(cat.key, { inApp: e.target.value as ChannelMode })}>
                      {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="notif-cfg__channel">
                    <Label>E-mail</Label>
                    <select className="rte__select" value={c.email} onChange={(e) => set(cat.key, { email: e.target.value as ChannelMode })}>
                      {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="muted mt-4 text-xs">Push não se aplica (sem app). O envio de e-mail de notificação ainda não está ativo; a configuração de e-mail fica preparada para o resumo por e-mail futuro.</p>

      <div className="rule-form__foot mt-4">
        <Button type="button" size="sm" onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
      </div>
    </div>
  );
}
