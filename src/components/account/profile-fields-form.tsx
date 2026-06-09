"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProfileFieldsAction } from "@/lib/actions/profile-field-actions";
import type { GroupWithValues, FieldWithValue } from "@/lib/profile-fields";

function parseSet(v: string): string[] {
  try {
    const a = JSON.parse(v);
    return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function ProfileFieldsForm({ groups }: { groups: GroupWithValues[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const g of groups) for (const f of g.fields) init[String(f.id)] = f.value;
    return init;
  });
  const [pending, setPending] = useState(false);

  function set(id: number, value: string) {
    setValues((prev) => ({ ...prev, [String(id)]: value }));
  }

  function toggleSet(id: number, option: string, on: boolean) {
    setValues((prev) => {
      const cur = parseSet(prev[String(id)] ?? "[]");
      const next = on ? [...new Set([...cur, option])] : cur.filter((o) => o !== option);
      return { ...prev, [String(id)]: JSON.stringify(next) };
    });
  }

  async function save() {
    setPending(true);
    const res = await saveProfileFieldsAction(JSON.stringify(values));
    setPending(false);
    if (res.ok) {
      toast.success("Perfil atualizado.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha.");
    }
  }

  function renderField(f: FieldWithValue) {
    const id = `pff-${f.id}`;
    const val = values[String(f.id)] ?? "";
    switch (f.type) {
      case "textarea":
      case "editor":
        return <textarea id={id} className="q-textarea" rows={4} value={val} maxLength={f.maxLength ?? undefined} onChange={(e) => set(f.id, e.target.value)} />;
      case "select":
        return (
          <select id={id} className="rte__select" value={val} onChange={(e) => set(f.id, e.target.value)}>
            <option value="">(Selecione)</option>
            {f.options.map((o) => (<option key={o} value={o}>{o}</option>))}
          </select>
        );
      case "radio":
        return (
          <div className="pff-options" role="radiogroup" aria-label={f.name}>
            {f.options.map((o) => (
              <label key={o} className="rule-form__check">
                <input type="radio" name={id} checked={val === o} onChange={() => set(f.id, o)} /> {o}
              </label>
            ))}
          </div>
        );
      case "checkboxset": {
        const sel = parseSet(val);
        return (
          <div className="pff-options">
            {f.options.map((o) => (
              <label key={o} className="rule-form__check">
                <input type="checkbox" checked={sel.includes(o)} onChange={(e) => toggleSet(f.id, o, e.target.checked)} /> {o}
              </label>
            ))}
          </div>
        );
      }
      case "yesno":
        return (
          <label className="rule-form__check">
            <input type="checkbox" checked={val === "1"} onChange={(e) => set(f.id, e.target.checked ? "1" : "0")} /> Sim
          </label>
        );
      case "number":
        return <Input id={id} type="number" value={val} onChange={(e) => set(f.id, e.target.value)} />;
      case "date":
        return <Input id={id} type="date" value={val} onChange={(e) => set(f.id, e.target.value)} />;
      case "url":
        return <Input id={id} type="url" value={val} placeholder="https://…" onChange={(e) => set(f.id, e.target.value)} />;
      case "color":
        return <Input id={id} type="color" className="h-9 w-16 p-1" value={val || "#000000"} onChange={(e) => set(f.id, e.target.value)} />;
      default:
        return <Input id={id} value={val} maxLength={f.maxLength ?? undefined} onChange={(e) => set(f.id, e.target.value)} />;
    }
  }

  return (
    <div className="rule-form">
      {groups.map((g) => (
        <section key={g.id} className="rule-form__section">
          <h2 className="rule-form__title">{g.name}</h2>
          {g.fields.map((f) => (
            <div key={f.id} className="field">
              <Label htmlFor={`pff-${f.id}`}>{f.name}{f.required ? " *" : ""}</Label>
              {f.description && <p className="muted -mt-1 mb-1 text-xs">{f.description}</p>}
              {renderField(f)}
            </div>
          ))}
        </section>
      ))}
      <div className="rule-form__foot">
        <Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar perfil"}</Button>
      </div>
    </div>
  );
}
