import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Redefinir senha" };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthShell title="Link inválido">
        <p className="text-sm text-muted-foreground">
          Link de redefinição ausente ou inválido.{" "}
          <Link href="/auth/esqueci" className="text-foreground underline">
            Solicitar novo
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Redefinir senha" description="Escolha uma nova senha.">
      <ResetForm token={token} />
    </AuthShell>
  );
}
