"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
        return <Textarea id={id} rows={4} value={val} maxLength={f.maxLength ?? undefined} onChange={(e) => set(f.id, e.target.value)} />;
      case "select":
        return (
          <Select value={val || undefined} onValueChange={(v) => set(f.id, v)}>
            <SelectTrigger id={id} className="w-full"><SelectValue placeholder="(Selecione)" /></SelectTrigger>
            <SelectContent>
              {f.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case "radio":
        return (
          <RadioGroup value={val} onValueChange={(v) => set(f.id, v)} aria-label={f.name} className="gap-2">
            {f.options.map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm"><RadioGroupItem value={o} /> {o}</label>
            ))}
          </RadioGroup>
        );
      case "checkboxset": {
        const sel = parseSet(val);
        return (
          <div className="flex flex-col gap-2">
            {f.options.map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm"><Checkbox checked={sel.includes(o)} onCheckedChange={(c) => toggleSet(f.id, o, c === true)} /> {o}</label>
            ))}
          </div>
        );
      }
      case "yesno":
        return (
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={val === "1"} onCheckedChange={(c) => set(f.id, c ? "1" : "0")} /> Sim
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
