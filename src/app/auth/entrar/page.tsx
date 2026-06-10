import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Entrar" };
export const dynamic = "force-dynamic"; // botão Google depende do env em runtime

export default function LoginPage() {
  const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
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
      {googleEnabled && <GoogleButton label="Entrar com Google" />}
    </AuthShell>
  );
}
