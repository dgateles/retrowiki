"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestEmailChangeAction } from "@/lib/actions/auth-actions";

export function ChangeEmailForm({ current }: { current: string }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await requestEmailChangeAction({ email });
    setPending(false);
    if (res.ok) { toast.success(res.message ?? "Confirmação enviada."); setSent(true); setEmail(""); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <form onSubmit={submit} className="member-create">
      <p className="muted text-sm">Seu e-mail atual é <strong>{current}</strong>. Enviaremos um link de confirmação para o novo endereço.</p>
      <div className="field">
        <Label htmlFor="ce-email">Novo e-mail</Label>
        <Input id="ce-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      {sent && <p className="muted text-sm">Verifique a caixa de entrada do novo e-mail para concluir a troca.</p>}
      <div>
        <Button type="submit" size="sm" disabled={pending || email.trim().length < 3}>{pending ? "Enviando…" : "Enviar confirmação"}</Button>
      </div>
    </form>
  );
}
