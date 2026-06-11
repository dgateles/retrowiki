"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { deleteRuleAction } from "@/lib/actions/achievement-actions";

export function AchievementRuleDelete({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <Button type="button" variant="outline" size="icon" className="size-9 shrink-0 text-muted-foreground hover:border-destructive hover:text-destructive" aria-label={`Excluir ${name}`} onClick={() => setOpen(true)}>
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Excluir regra</DialogTitle>
          <p className="muted mt-1">Remover a regra &ldquo;{name}&rdquo;?</p>
          <div className="modal-actions">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await deleteRuleAction(id);
                  if (res.ok) {
                    toast.success("Regra excluída.");
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
