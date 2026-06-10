"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acknowledgeWarningsAction } from "@/lib/actions/warning-actions";

export function AcknowledgeWarnings() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    const res = await acknowledgeWarningsAction();
    setPending(false);
    if (res.ok) { toast.success("Advertências confirmadas."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <div className="ack-warn">
      <p className="ack-warn__text">Você precisa confirmar que leu as advertências abaixo antes de poder publicar novamente.</p>
      <Button type="button" size="sm" onClick={confirm} disabled={pending}>{pending ? "Confirmando…" : "Confirmar que li"}</Button>
    </div>
  );
}
