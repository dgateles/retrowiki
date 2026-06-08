"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { moderateAction } from "@/lib/actions/article-actions";

export function ModerationActions({ reviewId }: { reviewId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function act(decision: "approved" | "changes_requested" | "rejected") {
    let reason: string | undefined;
    if (decision !== "approved") {
      reason = window.prompt("Motivo (será enviado ao autor):") ?? undefined;
      if (reason === undefined) return;
    }
    setPending(true);
    const res = await moderateAction({ reviewId, decision, reason });
    setPending(false);
    if (res.ok) {
      toast.success(
        decision === "approved"
          ? "Publicado."
          : decision === "rejected"
            ? "Rejeitado."
            : "Ajustes solicitados.",
      );
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha na ação.");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={pending} onClick={() => act("approved")}>
        Aprovar
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => act("changes_requested")}>
        Pedir ajustes
      </Button>
      <Button size="sm" variant="destructive" disabled={pending} onClick={() => act("rejected")}>
        Rejeitar
      </Button>
    </div>
  );
}
