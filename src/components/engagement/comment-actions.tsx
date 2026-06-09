"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { RichEditor } from "@/components/editor/rich-editor";
import { editCommentAction, deleteCommentAction } from "@/lib/actions/engagement-actions";
import { docHasText } from "@/components/engagement/comment-form";

type Props = {
  commentId: number;
  initialDoc: JSONContent;
  canEdit: boolean;
  canDelete: boolean;
};

export function CommentActions({ commentId, initialDoc, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [doc, setDoc] = useState<JSONContent>(initialDoc);
  const [pending, setPending] = useState(false);

  async function save() {
    if (!docHasText(doc)) return;
    setPending(true);
    const res = await editCommentAction(commentId, JSON.stringify(doc));
    setPending(false);
    if (res.ok) {
      setEditOpen(false);
      toast.success("Comentário atualizado.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha ao editar.");
    }
  }

  async function remove() {
    setPending(true);
    const res = await deleteCommentAction(commentId);
    setPending(false);
    if (res.ok) {
      setDelOpen(false);
      toast.success("Comentário excluído.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha ao excluir.");
    }
  }

  return (
    <div className="comment__actions">
      {canEdit && (
        <button type="button" className="comment__action" onClick={() => { setDoc(initialDoc); setEditOpen(true); }}>
          <Pencil className="size-3.5" aria-hidden="true" /> Editar
        </button>
      )}
      {canDelete && (
        <button type="button" className="comment__action comment__action--danger" onClick={() => setDelOpen(true)}>
          <Trash2 className="size-3.5" aria-hidden="true" /> Excluir
        </button>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-describedby={undefined} className="comment-edit">
          <DialogTitle>Editar comentário</DialogTitle>
          <div className="mt-4">
            <RichEditor value={initialDoc} onChange={setDoc} variant="comment" />
          </div>
          <div className="modal-actions">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button type="button" size="sm" onClick={save} disabled={pending || !docHasText(doc)}>
              {pending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Excluir comentário</DialogTitle>
          <p className="muted mt-1">Esta ação não pode ser desfeita.</p>
          <div className="modal-actions">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button type="button" variant="destructive" size="sm" onClick={remove} disabled={pending}>
              {pending ? "Excluindo…" : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
