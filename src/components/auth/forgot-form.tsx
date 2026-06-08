"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction } from "@/lib/actions/auth-actions";

export function ForgotForm() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    const res = await requestPasswordResetAction({ email: String(form.get("email") ?? "") });
    setPending(false);
    setDone(true);
    toast.message(res.message ?? "Verifique seu e-mail.");
  }

  if (done) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Se houver uma conta com esse e-mail, enviamos as instruções de
        redefinição. Verifique sua caixa de entrada.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <div className="field">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando…" : "Enviar instruções"}
      </Button>
    </form>
  );
}
