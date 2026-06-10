import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { confirmEmailChangeAction } from "@/lib/actions/auth-actions";

export const metadata: Metadata = { title: "Confirmar novo e-mail", robots: { index: false } };

export default async function ConfirmEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token ? await confirmEmailChangeAction(token) : { ok: false as const, error: "Token ausente." };

  return (
    <AuthShell title="Troca de e-mail">
      <div className="confirm">
        {result.ok ? (
          <CheckCircle2 className="confirm__icon--ok" aria-hidden="true" />
        ) : (
          <XCircle className="confirm__icon--bad" aria-hidden="true" />
        )}
        <p className="empty__text" role="status">
          {result.ok ? result.message : result.error}
        </p>
        <Button asChild className="w-full">
          <Link href="/conta?secao=email">Voltar às configurações</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
