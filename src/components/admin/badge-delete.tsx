"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { deleteBadgeAction } from "@/lib/actions/badge-actions";

export function BadgeDelete({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <button type="button" className="rule-row__del" aria-label={`Excluir ${name}`} onClick={() => setOpen(true)}>
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Excluir badge</DialogTitle>
          <p className="muted mt-1">Remover a badge &ldquo;{name}&rdquo;? Isso a retira de quem a possui.</p>
          <div className="modal-actions">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await deleteBadgeAction(id);
                  if (res.ok) {
                    toast.success("Badge excluída.");
                    setOpen(false);
                    router.refresh();
                  } else {
                    toast.error(res.error ?? "Falha.");
                  }
                })
              }
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
