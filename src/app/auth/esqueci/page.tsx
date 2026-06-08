import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function ForgotPage() {
  return (
    <AuthShell
      title="Recuperar senha"
      description="Enviaremos um link de redefinição para o seu e-mail."
      footer={
        <Link href="/auth/entrar" className="link-inline">
          Voltar para entrar
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
