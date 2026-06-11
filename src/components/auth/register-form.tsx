"use client";

import { useState, useCallback } from "react";
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

export function RegisterForm({ profileFields = [], qaChallenge = null, referredBy = "" }: { profileFields?: GroupWithValues[]; qaChallenge?: { id: number; question: string } | null; referredBy?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaSolution | null>(null);
  const onSolved = useCallback((s: CaptchaSolution | null) => setCaptcha(s), []);
  const [pf, setPf] = useState<Record<string, string>>({});
  const [qaAnswer, setQaAnswer] = useState("");

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
        qaQuestionId: qaChallenge?.id,
        qaAnswer,
        ref: referredBy,
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
        return <Textarea id={id} rows={3} value={val} maxLength={f.maxLength ?? undefined} onChange={(e) => setField(f.id, e.target.value)} />;
      case "select":
        return (
          <Select value={val || undefined} onValueChange={(v) => setField(f.id, v)}>
            <SelectTrigger id={id} className="w-full"><SelectValue placeholder="(Selecione)" /></SelectTrigger>
            <SelectContent>
              {f.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case "radio":
        return (
          <RadioGroup value={val} onValueChange={(v) => setField(f.id, v)} aria-label={f.name} className="gap-2">
            {f.options.map((o) => <label key={o} className="flex items-center gap-2 text-sm"><RadioGroupItem value={o} /> {o}</label>)}
          </RadioGroup>
        );
      case "checkboxset": {
        const sel = parseSet(val);
        return (
          <div className="flex flex-col gap-2">
            {f.options.map((o) => <label key={o} className="flex items-center gap-2 text-sm"><Checkbox checked={sel.includes(o)} onCheckedChange={(c) => toggleSet(f.id, o, c === true)} /> {o}</label>)}
          </div>
        );
      }
      case "yesno":
        return <label className="flex items-center gap-2 text-sm"><Switch checked={val === "1"} onCheckedChange={(c) => setField(f.id, c ? "1" : "0")} /> Sim</label>;
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

      {qaChallenge && (
        <div className="field">
          <Label htmlFor="qa-answer">{qaChallenge.question}</Label>
          <Input id="qa-answer" value={qaAnswer} onChange={(e) => setQaAnswer(e.target.value)} autoComplete="off" required />
        </div>
      )}

      <RetroGuard action="register" onSolved={onSolved} />
      <Button type="submit" className="w-full" disabled={pending || !captcha}>
        {pending ? "Criando…" : "Criar conta"}
      </Button>
    </form>
  );
}
