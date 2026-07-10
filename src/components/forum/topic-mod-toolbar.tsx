"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pin, PinOff, Lock, LockOpen, EyeOff, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { setTopicPinnedAction, setTopicLockedAction, hideTopicAction, deleteTopicAction } from "@/lib/actions/forum-mod-actions";
import { forumHref } from "@/lib/forum-url";

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
    <div className="fmod" role="group" aria-label="Ações de moderação">
      <span className="fmod__label"><Shield className="size-3.5" aria-hidden="true" /> Mod</span>
      <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => setTopicPinnedAction(topicId, !pinned), pinned ? "Desafixado." : "Fixado.")}>
        {pinned ? <PinOff className="size-4" aria-hidden="true" /> : <Pin className="size-4" aria-hidden="true" />}{pinned ? "Desafixar" : "Fixar"}
      </Button>
      <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => setTopicLockedAction(topicId, !locked), locked ? "Destrancado." : "Trancado.")}>
        {locked ? <LockOpen className="size-4" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}{locked ? "Destrancar" : "Trancar"}
      </Button>
      <Button variant="outline" size="sm" disabled={pending} onClick={() => setConfirm("hide")}><EyeOff className="size-4" aria-hidden="true" /> Ocultar</Button>
      <Button variant="outline" size="sm" className="text-destructive" disabled={pending} onClick={() => setConfirm("delete")}><Trash2 className="size-4" aria-hidden="true" /> Excluir</Button>

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
