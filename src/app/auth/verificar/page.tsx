import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { verifyEmailAction } from "@/lib/actions/auth-actions";

export const metadata: Metadata = { title: "Confirmar e-mail" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token
    ? await verifyEmailAction(token)
    : { ok: false, error: "Token ausente." };

  return (
    <AuthShell title="Confirmação de e-mail">
      <div className="flex flex-col items-center gap-3 text-center">
        {result.ok ? (
          <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
        ) : (
          <XCircle className="size-10 text-destructive" aria-hidden="true" />
        )}
        <p className="text-sm text-muted-foreground" role="status">
          {result.ok ? result.message : result.error}
        </p>
        <Button asChild className="w-full">
          <Link href="/auth/entrar">Ir para o login</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
