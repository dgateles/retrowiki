"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { moderateAction } from "@/lib/actions/article-actions";

type Reasoned = "changes_requested" | "rejected";

export function ModerationActions({ reviewId }: { reviewId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [modal, setModal] = useState<Reasoned | null>(null);
  const [reason, setReason] = useState("");

  async function run(decision: "approved" | Reasoned, reasonText?: string) {
    setPending(true);
    const res = await moderateAction({ reviewId, decision, reason: reasonText });
    setPending(false);
    if (res.ok) {
      toast.success(
        decision === "approved" ? "Publicado." : decision === "rejected" ? "Rejeitado." : "Ajustes solicitados.",
      );
      setModal(null);
      setReason("");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha na ação.");
    }
  }

  return (
    <>
      <div className="btn-row">
        <Button size="sm" disabled={pending} onClick={() => run("approved")}>
          Aprovar
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setModal("changes_requested")}>
          Pedir ajustes
        </Button>
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => setModal("rejected")}>
          Rejeitar
        </Button>
      </div>

      <Dialog open={modal !== null} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent
          onCloseAutoFocus={() => setReason("")}
          aria-describedby="mod-reason-desc"
        >
          <DialogTitle>{modal === "rejected" ? "Rejeitar conteúdo" : "Pedir ajustes"}</DialogTitle>
          <DialogDescription id="mod-reason-desc">
            O motivo será enviado ao autor.
          </DialogDescription>
          <form
            className="form mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (modal) run(modal, reason.trim() || undefined);
            }}
          >
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              autoFocus
              aria-label="Motivo"
              placeholder="Explique o que precisa mudar"
              className="editor__control"
            />
            <div className="modal-actions">
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm">Cancelar</Button>
              </DialogClose>
              <Button type="submit" size="sm" variant={modal === "rejected" ? "destructive" : "default"} disabled={pending}>
                {pending ? "Enviando…" : "Confirmar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
