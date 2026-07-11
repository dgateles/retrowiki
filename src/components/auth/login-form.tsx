"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkLoginMfaAction } from "@/lib/actions/mfa-actions";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [needCode, setNeedCode] = useState(false);
  // Guarda as credenciais entre o precheck e o envio final com código.
  const [creds, setCreds] = useState<{ email: string; password: string }>({ email: "", password: "" });

  async function finishSignIn(email: string, password: string, code?: string) {
    const res = await signIn("credentials", { email, password, code, redirect: false });
    if (res?.error) {
      toast.error(code ? "Código de verificação inválido." : "E-mail ou senha inválidos.");
      return false;
    }
    toast.success("Bem-vindo de volta!");
    router.push("/");
    router.refresh();
    return true;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);

    if (needCode) {
      const code = String(form.get("code") ?? "").trim();
      await finishSignIn(creds.email, creds.password, code);
      setPending(false);
      return;
    }

    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    // Precheck: descobre se a conta exige um segundo fator antes de mostrar o campo.
    const check = await checkLoginMfaAction(email, password);
    if (check.ok && check.data?.needCode) {
      setCreds({ email, password });
      setNeedCode(true);
      setPending(false);
      return;
    }

    // Sem 2FA (ou credenciais inválidas): tenta o login normal.
    await finishSignIn(email, password);
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="form">
      {!needCode ? (
        <>
          <div className="field">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="field">
            <div className="field__row">
              <Label htmlFor="password">Senha</Label>
              <Link href="/auth/esqueci" className="field__link">
                Esqueci a senha
              </Link>
            </div>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
        </>
      ) : (
        <div className="field">
          <Label htmlFor="code">Código de verificação</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            placeholder="000000 ou código de recuperação"
          />
          <p className="field__hint">
            Digite o código de 6 dígitos do seu app autenticador ou um código de recuperação.
          </p>
          <button
            type="button"
            className="field__link mt-1 self-start"
            onClick={() => { setNeedCode(false); setCreds({ email: "", password: "" }); }}
          >
            Usar outra conta
          </button>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Entrando…" : needCode ? "Verificar" : "Entrar"}
      </Button>
    </form>
  );
}
