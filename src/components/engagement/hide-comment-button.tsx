"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { hideCommentAction } from "@/lib/actions/engagement-actions";

export function HideCommentButton({ commentId }: { commentId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const res = await hideCommentAction(commentId);
      if (res.ok) {
        toast.success("Comentário ocultado.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Falha ao ocultar.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-2"
      >
        <EyeOff className="size-3.5" aria-hidden="true" /> Ocultar
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby="hide-desc">
          <DialogTitle>Ocultar comentário</DialogTitle>
          <DialogDescription id="hide-desc">
            O comentário deixará de aparecer no guia. A ação fica registrada.
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">Cancelar</Button>
            </DialogClose>
            <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={confirm}>
              {pending ? "Ocultando…" : "Ocultar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
