"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { NOTIFICATION_CATEGORIES, type NotificationsConfig, type ChannelMode } from "@/lib/notifications-config";
import { saveNotificationsConfigAction, resetAllMemberPrefsAction } from "@/lib/actions/notification-config-actions";
import { useConfirm } from "@/components/admin/confirm-dialog";

const MODES: { value: ChannelMode; label: string }[] = [
  { value: "default_on", label: "Ligado por padrão" },
  { value: "default_off", label: "Desligado por padrão" },
  { value: "disabled", label: "Desabilitado" },
];

export function NotificationsConfigForm({ config: initial }: { config: NotificationsConfig }) {
  const router = useRouter();
  const confirm = useConfirm();
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
    if (!(await confirm({ title: "Redefinir preferências", description: "Isto apaga as preferências de notificação de todos os membros, voltando aos padrões. Continuar?", confirmLabel: "Redefinir", destructive: true }))) return;
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
            <li key={cat.key} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold">{cat.label}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{cat.description}</p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-sm">
                  <Checkbox checked={c.memberEditable} onCheckedChange={(ck) => set(cat.key, { memberEditable: ck === true })} /> Membro pode editar
                </label>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:max-w-md">
                <div className="field">
                  <Label htmlFor={`nc-app-${cat.key}`}>Sino (in-app)</Label>
                  <Select value={c.inApp} onValueChange={(val) => set(cat.key, { inApp: val as ChannelMode })}>
                    <SelectTrigger id={`nc-app-${cat.key}`} className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="field">
                  <Label htmlFor={`nc-email-${cat.key}`}>E-mail</Label>
                  <Select value={c.email} onValueChange={(val) => set(cat.key, { email: val as ChannelMode })}>
                    <SelectTrigger id={`nc-email-${cat.key}`} className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
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
