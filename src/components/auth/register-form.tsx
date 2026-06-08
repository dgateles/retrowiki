"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RetroGuard, type CaptchaSolution } from "@/components/captcha/retroguard";
import { registerAction } from "@/lib/actions/auth-actions";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaSolution | null>(null);
  const onSolved = useCallback((s: CaptchaSolution | null) => setCaptcha(s), []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    const res = await registerAction(
      {
        email: String(form.get("email") ?? ""),
        handle: String(form.get("handle") ?? ""),
        password: String(form.get("password") ?? ""),
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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="handle">Nome de usuário</Label>
        <Input id="handle" name="handle" required minLength={3} maxLength={30} autoComplete="username" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
      </div>
      <RetroGuard action="register" onSolved={onSolved} />
      <Button type="submit" className="w-full" disabled={pending || !captcha}>
        {pending ? "Criando…" : "Criar conta"}
      </Button>
    </form>
  );
}
