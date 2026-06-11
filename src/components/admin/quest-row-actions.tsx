"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { toggleQuestAction, deleteQuestAction, deleteTaskAction } from "@/lib/actions/quest-actions";

export function QuestToggle({ id, enabled }: { id: number; enabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant={enabled ? "outline" : "default"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await toggleQuestAction(id, !enabled);
          if (res.ok) {
            toast.success(enabled ? "Missão desativada." : "Missão ativada.");
            router.refresh();
          } else {
            toast.error(res.error ?? "Falha.");
          }
        })
      }
    >
      {enabled ? "Desativar" : "Ativar"}
    </Button>
  );
}

export function QuestDelete({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <Button type="button" variant="outline" size="icon" className="size-9 shrink-0 text-muted-foreground hover:border-destructive hover:text-destructive" aria-label={`Excluir ${title}`} onClick={() => setOpen(true)}>
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Excluir missão</DialogTitle>
          <p className="muted mt-1">Remover &ldquo;{title}&rdquo; e suas tarefas?</p>
          <div className="modal-actions">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={() => start(async () => {
              const res = await deleteQuestAction(id);
              if (res.ok) { toast.success("Missão excluída."); setOpen(false); router.refresh(); } else { toast.error(res.error ?? "Falha."); }
            })}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TaskDelete({ id, questId, title }: { id: number; questId: number; title: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="size-9 shrink-0 text-muted-foreground hover:border-destructive hover:text-destructive"
      aria-label={`Excluir tarefa ${title}`}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await deleteTaskAction(id, questId);
          if (res.ok) { toast.success("Tarefa excluída."); router.refresh(); } else { toast.error(res.error ?? "Falha."); }
        })
      }
    >
      <Trash2 className="size-4" aria-hidden="true" />
    </Button>
  );
}
