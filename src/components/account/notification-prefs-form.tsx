"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { saveMyNotificationPrefsAction } from "@/lib/actions/notification-config-actions";
import type { MemberCategoryPref } from "@/lib/notifications-prefs";

export function NotificationPrefsForm({ prefs: initial }: { prefs: MemberCategoryPref[] }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(initial);
  const [pending, setPending] = useState(false);

  function set(key: string, channel: "inApp" | "email", value: boolean) {
    setPrefs((prev) => prev.map((p) => (p.key === key ? { ...p, [channel]: value } : p)));
  }

  async function save() {
    setPending(true);
    const body = Object.fromEntries(prefs.map((p) => [p.key, { inApp: p.inApp, email: p.email }]));
    const res = await saveMyNotificationPrefsAction(JSON.stringify(body));
    setPending(false);
    if (res.ok) { toast.success("Preferências salvas."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  if (prefs.length === 0) return <p className="muted">Nenhuma preferência disponível.</p>;

  return (
    <div className="rule-form">
      <section className="flex flex-col gap-3">
        {prefs.map((p) => (
          <div key={p.key} className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
            <div className="min-w-0">
              <p className="font-semibold">{p.label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{p.description}</p>
            </div>
            <div className="flex shrink-0 gap-x-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={p.inApp} disabled={!p.editable || p.inAppLocked} onCheckedChange={(c) => set(p.key, "inApp", c)} /> Sino
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={p.email} disabled={!p.editable || p.emailLocked} onCheckedChange={(c) => set(p.key, "email", c)} /> E-mail
              </label>
            </div>
          </div>
        ))}
      </section>
      <div className="rule-form__foot mt-4">
        <Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar preferências"}</Button>
      </div>
    </div>
  );
}
