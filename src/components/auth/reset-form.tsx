"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/lib/actions/auth-actions";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    const res = await resetPasswordAction({
      token,
      password: String(form.get("password") ?? ""),
    });
    setPending(false);
    if (res.ok) {
      toast.success(res.message ?? "Senha redefinida!");
      router.push("/auth/entrar");
    } else {
      toast.error(res.error ?? "Não foi possível redefinir.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <div className="field">
        <Label htmlFor="password">Nova senha</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <p className="field__hint">Mínimo de 8 caracteres.</p>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando…" : "Redefinir senha"}
      </Button>
    </form>
  );
}
