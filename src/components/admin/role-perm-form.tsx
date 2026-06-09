"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setRolePermissionsAction } from "@/lib/actions/role-actions";

type FieldType = "bool" | "number" | "color";
type Tab = "settings" | "content" | "social";
type Field = { key: string; label: string; type: FieldType; tab: Tab; help?: string };
type Values = Record<string, boolean | number | string>;

const TABS: { id: Tab; label: string }[] = [
  { id: "settings", label: "Configurações" },
  { id: "content", label: "Conteúdo" },
  { id: "social", label: "Social" },
];

export function RolePermForm({ role, fields, initial }: { role: string; fields: Field[]; initial: Values }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("settings");
  const [values, setValues] = useState<Values>(initial);
  const [pending, setPending] = useState(false);

  function set(key: string, v: boolean | number | string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function save() {
    setPending(true);
    const res = await setRolePermissionsAction(role, JSON.stringify(values));
    setPending(false);
    if (res.ok) {
      toast.success("Permissões salvas.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha ao salvar.");
    }
  }

  return (
    <div className="perm-form">
      <div className="perm-form__tabs" role="tablist" aria-label="Seções de permissão">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={cn("perm-form__tab", tab === t.id && "perm-form__tab--active")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="perm-form__panel" role="tabpanel">
        {fields.filter((f) => f.tab === tab).map((f) => (
          <div key={f.key} className="perm-field">
            <div className="perm-field__label">
              <label htmlFor={`pf-${f.key}`}>{f.label}</label>
              {f.help && <p className="perm-field__help">{f.help}</p>}
            </div>
            <div className="perm-field__control">
              {f.type === "bool" && (
                <input
                  id={`pf-${f.key}`}
                  type="checkbox"
                  checked={Boolean(values[f.key])}
                  onChange={(e) => set(f.key, e.target.checked)}
                />
              )}
              {f.type === "number" && (
                <Input
                  id={`pf-${f.key}`}
                  type="number"
                  min={0}
                  value={String(values[f.key] ?? 0)}
                  onChange={(e) => set(f.key, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  className="w-28"
                />
              )}
              {f.type === "color" && (
                <input
                  id={`pf-${f.key}`}
                  type="color"
                  value={String(values[f.key] ?? "#000000")}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="perm-field__color"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="perm-form__foot">
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
