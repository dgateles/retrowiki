import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Criar conta"
      description="Junte-se à comunidade para contribuir com tutoriais e guias."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/auth/entrar" className="text-foreground underline">
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
