import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Entrar"
      description="Acesse sua conta da RetroWiki."
      footer={
        <>
          Não tem conta?{" "}
          <Link href="/auth/cadastrar" className="link-inline">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
