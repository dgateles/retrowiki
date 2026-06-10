"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendVerificationAction } from "@/lib/actions/auth-actions";

export function VerifyEmailBanner() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend() {
    setPending(true);
    const res = await resendVerificationAction();
    setPending(false);
    if (res.ok) { toast.success(res.message ?? "Confirmação enviada."); setSent(true); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <aside className="profile-nudge profile-nudge--warn mt-6" aria-label="Confirme seu e-mail">
      <div className="min-w-0">
        <p className="profile-nudge__title"><MailWarning className="mr-1 inline size-4 align-text-bottom" aria-hidden="true" /> Confirme seu e-mail</p>
        <p className="profile-nudge__text">Você precisa confirmar seu e-mail para publicar guias e comentários.</p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={resend} disabled={pending || sent}>
        {pending ? "Enviando…" : sent ? "E-mail enviado" : "Reenviar confirmação"}
      </Button>
    </aside>
  );
}
