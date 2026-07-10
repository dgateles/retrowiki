"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { hidePostAction, deletePostAction } from "@/lib/actions/forum-mod-actions";

export function PostModActions({ postId }: { postId: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState<null | "hide" | "delete">(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) { toast.success(okMsg); router.refresh(); } else toast.error(res.error ?? "Falha.");
    });

  return (
    <>
      <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={pending} onClick={() => setConfirm("hide")}><EyeOff className="size-4" aria-hidden="true" /> Ocultar</Button>
      <Button variant="ghost" size="sm" className="text-destructive" disabled={pending} onClick={() => setConfirm("delete")}><Trash2 className="size-4" aria-hidden="true" /> Excluir</Button>
      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>{confirm === "delete" ? "Excluir post" : "Ocultar post"}</DialogTitle>
          <p className="muted mt-1">{confirm === "delete" ? "Excluir este post?" : "Ocultar este post do público?"}</p>
          <div className="modal-actions">
            <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button variant={confirm === "delete" ? "destructive" : "default"} size="sm" disabled={pending}
              onClick={() => { const c = confirm; setConfirm(null); if (c === "delete") run(() => deletePostAction(postId), "Post excluído."); else run(() => hidePostAction(postId), "Post oculto."); }}>
              {confirm === "delete" ? "Excluir" : "Ocultar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
