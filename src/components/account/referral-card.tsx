"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

export function ReferralCard({ link, count }: { link: string; count: number }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copiado.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <section aria-label="Indicações" className="referral mt-6">
      <div className="min-w-0">
        <p className="referral__title">Indique a RetroWiki</p>
        <p className="referral__text">
          {count > 0 ? `Você já trouxe ${count} ${count === 1 ? "membro" : "membros"}.` : "Compartilhe seu link e traga novos membros."}
        </p>
        <code className="referral__link">{link}</code>
      </div>
      <button type="button" className="referral__copy" onClick={copy}>
        {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        {copied ? "Copiado" : "Copiar link"}
      </button>
    </section>
  );
}
