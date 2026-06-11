"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setArticleStatusAction, deleteArticleAction } from "@/lib/actions/article-actions";
import { useConfirm } from "@/components/admin/confirm-dialog";

export function ArticleActions({ id, status, title }: { id: number; status: string; title: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: string, label: string) {
    setBusy(true);
    const res = await setArticleStatusAction(id, next);
    setBusy(false);
    if (res.ok) { toast.success(label); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function remove() {
    if (!(await confirm({ title: "Excluir artigo", description: `Excluir "${title}" e tudo relacionado (revisões, comentários, reações)? Não há como desfazer.`, confirmLabel: "Excluir", destructive: true }))) return;
    setBusy(true);
    const res = await deleteArticleAction(id);
    setBusy(false);
    if (res.ok) { toast.success("Artigo excluído."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {status === "published" ? (
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setStatus("archived", "Artigo arquivado.")}><Archive className="size-4" aria-hidden="true" /> Arquivar</Button>
      ) : (
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setStatus("published", "Artigo publicado.")}><Upload className="size-4" aria-hidden="true" /> Publicar</Button>
      )}
      <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Excluir" disabled={busy} onClick={remove}><Trash2 className="size-4" aria-hidden="true" /></Button>
    </div>
  );
}
