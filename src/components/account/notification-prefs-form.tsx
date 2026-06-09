"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
      <section className="rule-form__section">
        {prefs.map((p) => (
          <div key={p.key} className="notif-pref">
            <div>
              <p className="notif-pref__label">{p.label}</p>
              <p className="pf-field__meta">{p.description}</p>
            </div>
            <div className="notif-pref__channels">
              <label className="rule-form__check">
                <input type="checkbox" checked={p.inApp} disabled={!p.editable || p.inAppLocked} onChange={(e) => set(p.key, "inApp", e.target.checked)} /> Sino
              </label>
              <label className="rule-form__check">
                <input type="checkbox" checked={p.email} disabled={!p.editable || p.emailLocked} onChange={(e) => set(p.key, "email", e.target.checked)} /> E-mail
              </label>
            </div>
          </div>
        ))}
      </section>
      <div className="rule-form__foot">
        <Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar preferências"}</Button>
      </div>
    </div>
  );
}
