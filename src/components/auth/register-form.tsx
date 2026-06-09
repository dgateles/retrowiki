"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RetroGuard, type CaptchaSolution } from "@/components/captcha/retroguard";
import { registerAction } from "@/lib/actions/auth-actions";
import type { GroupWithValues, FieldWithValue } from "@/lib/profile-fields";

function parseSet(v: string): string[] {
  try {
    const a = JSON.parse(v);
    return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function RegisterForm({ profileFields = [] }: { profileFields?: GroupWithValues[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaSolution | null>(null);
  const onSolved = useCallback((s: CaptchaSolution | null) => setCaptcha(s), []);
  const [pf, setPf] = useState<Record<string, string>>({});

  const setField = (id: number, value: string) => setPf((p) => ({ ...p, [String(id)]: value }));
  const toggleSet = (id: number, opt: string, on: boolean) =>
    setPf((p) => {
      const cur = parseSet(p[String(id)] ?? "[]");
      const next = on ? [...new Set([...cur, opt])] : cur.filter((o) => o !== opt);
      return { ...p, [String(id)]: JSON.stringify(next) };
    });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    const res = await registerAction(
      {
        email: String(form.get("email") ?? ""),
        handle: String(form.get("handle") ?? ""),
        password: String(form.get("password") ?? ""),
        profileFields: pf,
      },
      captcha ?? undefined,
    );
    setPending(false);
    if (res.ok) {
      toast.success(res.message ?? "Conta criada!");
      router.push("/auth/entrar");
    } else {
      toast.error(res.error ?? "Não foi possível criar a conta.");
    }
  }

  function renderField(f: FieldWithValue) {
    const id = `rf-${f.id}`;
    const val = pf[String(f.id)] ?? "";
    switch (f.type) {
      case "textarea":
      case "editor":
        return <textarea id={id} className="q-textarea" rows={3} value={val} maxLength={f.maxLength ?? undefined} onChange={(e) => setField(f.id, e.target.value)} />;
      case "select":
        return (
          <select id={id} className="rte__select" value={val} onChange={(e) => setField(f.id, e.target.value)}>
            <option value="">(Selecione)</option>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      case "radio":
        return (
          <div className="pff-options" role="radiogroup" aria-label={f.name}>
            {f.options.map((o) => <label key={o} className="rule-form__check"><input type="radio" name={id} checked={val === o} onChange={() => setField(f.id, o)} /> {o}</label>)}
          </div>
        );
      case "checkboxset": {
        const sel = parseSet(val);
        return (
          <div className="pff-options">
            {f.options.map((o) => <label key={o} className="rule-form__check"><input type="checkbox" checked={sel.includes(o)} onChange={(e) => toggleSet(f.id, o, e.target.checked)} /> {o}</label>)}
          </div>
        );
      }
      case "yesno":
        return <label className="rule-form__check"><input type="checkbox" checked={val === "1"} onChange={(e) => setField(f.id, e.target.checked ? "1" : "0")} /> Sim</label>;
      case "number":
        return <Input id={id} type="number" value={val} onChange={(e) => setField(f.id, e.target.value)} />;
      case "date":
        return <Input id={id} type="date" value={val} onChange={(e) => setField(f.id, e.target.value)} />;
      case "url":
        return <Input id={id} type="url" value={val} placeholder="https://…" onChange={(e) => setField(f.id, e.target.value)} />;
      case "color":
        return <Input id={id} type="color" className="h-9 w-16 p-1" value={val || "#000000"} onChange={(e) => setField(f.id, e.target.value)} />;
      default:
        return <Input id={id} value={val} maxLength={f.maxLength ?? undefined} onChange={(e) => setField(f.id, e.target.value)} />;
    }
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <div className="field">
        <Label htmlFor="handle">Nome de usuário</Label>
        <Input id="handle" name="handle" required minLength={3} maxLength={30} autoComplete="username" />
      </div>
      <div className="field">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <p className="field__hint">Mínimo de 8 caracteres.</p>
      </div>

      {profileFields.map((g) =>
        g.fields.map((f) => (
          <div key={f.id} className="field">
            <Label htmlFor={`rf-${f.id}`}>{f.name}{f.required ? " *" : ""}</Label>
            {f.description && <p className="field__hint">{f.description}</p>}
            {renderField(f)}
          </div>
        )),
      )}

      <RetroGuard action="register" onSolved={onSolved} />
      <Button type="submit" className="w-full" disabled={pending || !captcha}>
        {pending ? "Criando…" : "Criar conta"}
      </Button>
    </form>
  );
}
