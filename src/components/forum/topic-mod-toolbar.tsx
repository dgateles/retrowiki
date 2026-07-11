"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Settings2, Pin, PinOff, Lock, LockOpen, EyeOff, Trash2, ChevronDown, FolderInput, Merge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { setTopicPinnedAction, setTopicLockedAction, hideTopicAction, deleteTopicAction, moveTopicAction, mergeTopicsAction, listForumsForMoveAction, resolveTopicBySlugAction } from "@/lib/actions/forum-mod-actions";
import { forumHref } from "@/lib/forum-url";

/** Menu "Ações" do tópico (estilo IPB): agrupa as funções de moderação num único
 * botão em vez de vários botões soltos. */
export function TopicModToolbar({ topicId, forumSlug, pinned, locked }: { topicId: number; forumSlug: string; pinned: boolean; locked: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState<null | "hide" | "delete">(null);

  // Mover
  const [moveOpen, setMoveOpen] = useState(false);
  const [forumOptions, setForumOptions] = useState<{ id: number; title: string }[] | null>(null);
  const [moveTarget, setMoveTarget] = useState<string>("");

  // Mesclar
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeUrl, setMergeUrl] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string, redirect?: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) { toast.success(okMsg); if (redirect) router.push(redirect); else router.refresh(); }
      else toast.error(res.error ?? "Falha.");
    });

  async function openMove() {
    setMoveOpen(true);
    if (!forumOptions) {
      const res = await listForumsForMoveAction();
      if (res.ok && res.data) setForumOptions(res.data);
    }
  }

  function doMerge() {
    start(async () => {
      const resolved = await resolveTopicBySlugAction(mergeUrl);
      if (!resolved.ok || !resolved.data) { toast.error(resolved.error ?? "Tópico não encontrado."); return; }
      const res = await mergeTopicsAction(topicId, resolved.data.id);
      if (res.ok) {
        toast.success(`Mesclado em "${resolved.data.title}".`);
        setMergeOpen(false);
        const path = mergeUrl.match(/\/forum\/[^\s?#]+/);
        router.push(path ? path[0] : forumHref(forumSlug));
      } else toast.error(res.error ?? "Falha ao mesclar.");
    });
  }

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
          <DropdownMenuItem onSelect={() => openMove()}><FolderInput className="size-4" aria-hidden="true" /> Mover…</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMergeOpen(true)}><Merge className="size-4" aria-hidden="true" /> Mesclar…</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirm("hide")}><EyeOff className="size-4" aria-hidden="true" /> Ocultar</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirm("delete")}><Trash2 className="size-4" aria-hidden="true" /> Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mover para outro fórum */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent aria-describedby="move-desc">
          <DialogTitle>Mover tópico</DialogTitle>
          <DialogDescription id="move-desc">Escolha o fórum de destino. As respostas vão junto.</DialogDescription>
          <div className="mt-3">
            <Label htmlFor="move-forum" className="mb-2 block text-sm font-medium">Fórum de destino</Label>
            <Select value={moveTarget} onValueChange={setMoveTarget}>
              <SelectTrigger id="move-forum" className="w-full"><SelectValue placeholder={forumOptions ? "Selecione…" : "Carregando…"} /></SelectTrigger>
              <SelectContent>
                {forumOptions?.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="modal-actions">
            <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button size="sm" disabled={pending || !moveTarget} onClick={() => run(() => moveTopicAction(topicId, Number(moveTarget)), "Tópico movido.")}>Mover</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mesclar neste outro tópico */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent aria-describedby="merge-desc">
          <DialogTitle>Mesclar tópico</DialogTitle>
          <DialogDescription id="merge-desc">As respostas deste tópico vão para o tópico de destino, e este é encerrado.</DialogDescription>
          <div className="mt-3">
            <Label htmlFor="merge-url" className="mb-2 block text-sm font-medium">URL ou slug do tópico de destino</Label>
            <Input id="merge-url" value={mergeUrl} onChange={(e) => setMergeUrl(e.target.value)} placeholder="/forum/…/algum-topico" />
          </div>
          <div className="modal-actions">
            <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button variant="destructive" size="sm" disabled={pending || mergeUrl.trim().length < 3} onClick={doMerge}>Mesclar</Button>
          </div>
        </DialogContent>
      </Dialog>

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
