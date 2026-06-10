import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getRegisterFields } from "@/lib/profile-fields";
import { randomQuestion } from "@/lib/spam";

export const metadata: Metadata = { title: "Criar conta" };
export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const [{ ref }, profileFields, qaChallenge] = await Promise.all([searchParams, getRegisterFields(), randomQuestion()]);
  return (
    <AuthShell
      title="Criar conta"
      description="Junte-se à comunidade para contribuir com tutoriais e guias."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/auth/entrar" className="link-inline">
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm profileFields={profileFields} qaChallenge={qaChallenge} referredBy={ref ?? ""} />
    </AuthShell>
  );
}
