"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/lib/actions/account-actions";

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setPending(true);
    const res = await changePasswordAction({
      currentPassword: String(data.get("current") ?? ""),
      newPassword: String(data.get("new") ?? ""),
    });
    setPending(false);
    if (res.ok) {
      toast.success(res.message ?? "Senha alterada.");
      form.reset();
    } else {
      toast.error(res.error ?? "Não foi possível alterar.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="form form--narrow">
      <div className="field">
        <Label htmlFor="current">Senha atual</Label>
        <Input id="current" name="current" type="password" required autoComplete="current-password" />
      </div>
      <div className="field">
        <Label htmlFor="new">Nova senha</Label>
        <Input id="new" name="new" type="password" required minLength={8} autoComplete="new-password" />
        <p className="field__hint">Mínimo de 8 caracteres.</p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Alterar senha"}
      </Button>
    </form>
  );
}
