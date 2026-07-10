"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Settings2, Pin, PinOff, Lock, LockOpen, EyeOff, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { setTopicPinnedAction, setTopicLockedAction, hideTopicAction, deleteTopicAction } from "@/lib/actions/forum-mod-actions";
import { forumHref } from "@/lib/forum-url";

/** Menu "Ações" do tópico (estilo IPB): agrupa as funções de moderação num único
 * botão em vez de vários botões soltos. */
export function TopicModToolbar({ topicId, forumSlug, pinned, locked }: { topicId: number; forumSlug: string; pinned: boolean; locked: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState<null | "hide" | "delete">(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string, redirect?: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) { toast.success(okMsg); if (redirect) router.push(redirect); else router.refresh(); }
      else toast.error(res.error ?? "Falha.");
    });

  return (
    <div className="fmod">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={pending}>
            <Settings2 className="size-4" aria-hidden="true" /> Ações <ChevronDown className="size-4 opacity-60" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => run(() => setTopicPinnedAction(topicId, !pinned), pinned ? "Desafixado." : "Fixado.")}>
            {pinned ? <PinOff className="size-4" aria-hidden="true" /> : <Pin className="size-4" aria-hidden="true" />} {pinned ? "Desafixar" : "Fixar"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => run(() => setTopicLockedAction(topicId, !locked), locked ? "Destrancado." : "Trancado.")}>
            {locked ? <LockOpen className="size-4" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />} {locked ? "Destrancar" : "Trancar"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirm("hide")}><EyeOff className="size-4" aria-hidden="true" /> Ocultar</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirm("delete")}><Trash2 className="size-4" aria-hidden="true" /> Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>{confirm === "delete" ? "Excluir tópico" : "Ocultar tópico"}</DialogTitle>
          <p className="muted mt-1">{confirm === "delete" ? "Excluir este tópico? Ele some da listagem." : "Ocultar este tópico do público? Você pode reexibir depois."}</p>
          <div className="modal-actions">
            <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button variant={confirm === "delete" ? "destructive" : "default"} size="sm" disabled={pending}
              onClick={() => { const c = confirm; setConfirm(null); if (c === "delete") run(() => deleteTopicAction(topicId), "Tópico excluído.", forumHref(forumSlug)); else run(() => hideTopicAction(topicId), "Tópico oculto.", forumHref(forumSlug)); }}>
              {confirm === "delete" ? "Excluir" : "Ocultar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
