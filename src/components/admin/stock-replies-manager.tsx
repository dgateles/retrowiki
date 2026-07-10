"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";
import { Plus, Pencil, Trash2, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichEditor } from "@/components/editor/rich-editor";
import { docHasText } from "@/components/engagement/comment-form";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { saveStockReplyAction, deleteStockReplyAction } from "@/lib/actions/stock-replies-actions";

const EMPTY: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };
type Reply = { id: number; title: string; body: string; sortOrder: number };
type Draft = { id?: number; title: string; doc: JSONContent; sortOrder: number };

function parseBody(body: string): JSONContent {
  try { const d = JSON.parse(body); if (d && d.type === "doc") return d; } catch { /* ignora */ }
  return EMPTY;
}

export function StockRepliesManager({ replies }: { replies: Reply[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [del, setDel] = useState<{ id: number; title: string } | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  function open(d: Draft) { setDraft(d); setEditorKey((k) => k + 1); }

  function save() {
    if (!draft || draft.title.trim().length < 2 || !docHasText(draft.doc)) return;
    start(async () => {
      const res = await saveStockReplyAction({ id: draft.id, title: draft.title.trim(), body: JSON.stringify(draft.doc), sortOrder: draft.sortOrder });
      if (res.ok) { toast.success("Resposta salva."); setDraft(null); router.refresh(); }
      else toast.error(res.error ?? "Falha.");
    });
  }
  function confirmDelete() {
    if (!del) return;
    start(async () => {
      const res = await deleteStockReplyAction(del.id);
      if (res.ok) { toast.success("Excluída."); setDel(null); router.refresh(); }
      else toast.error(res.error ?? "Falha.");
    });
  }

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="page__title">Respostas prontas</h1>
          <p className="page__note">Modelos que a equipe insere com um clique ao responder no fórum.</p>
        </div>
        <Button size="sm" onClick={() => open({ title: "", doc: EMPTY, sortOrder: 0 })}><Plus className="size-4" aria-hidden="true" /> Nova resposta</Button>
      </div>

      {replies.length === 0 ? (
        <Empty className="mt-6">
          <EmptyHeader>
            <EmptyMedia variant="icon"><MessageSquareText aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>Nenhuma resposta pronta</EmptyTitle>
            <EmptyDescription>Crie modelos para perguntas frequentes e avisos comuns.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent><Button size="sm" onClick={() => open({ title: "", doc: EMPTY, sortOrder: 0 })}><Plus className="size-4" aria-hidden="true" /> Nova resposta</Button></EmptyContent>
        </Empty>
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
          {replies.map((r) => (
            <li key={r.id} className="flex items-center gap-3 bg-card p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">Ordem {r.sortOrder}</p>
              </div>
              <Button variant="ghost" size="icon" className="size-8" aria-label={`Editar ${r.title}`} onClick={() => open({ id: r.id, title: r.title, doc: parseBody(r.body), sortOrder: r.sortOrder })}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon" className="size-8 text-destructive" aria-label={`Excluir ${r.title}`} onClick={() => setDel({ id: r.id, title: r.title })}><Trash2 className="size-4" /></Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent aria-describedby={undefined} className="max-w-2xl">
          <DialogTitle>{draft?.id ? "Editar resposta" : "Nova resposta"}</DialogTitle>
          {draft && (
            <div className="mt-3 flex flex-col gap-3">
              <div className="field"><Label htmlFor="sr-title">Título</Label><Input id="sr-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={120} placeholder="Ex.: Como pedir suporte" /></div>
              <div className="field">
                <Label>Conteúdo</Label>
                <RichEditor key={editorKey} variant="comment" value={draft.doc} onChange={(doc) => setDraft({ ...draft, doc })} placeholder="Escreva o modelo de resposta…" />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sr-order" className="text-sm">Ordem</Label>
                <Input id="sr-order" type="number" className="w-20" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })} />
              </div>
              <div className="modal-actions">
                <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
                <Button size="sm" disabled={pending || draft.title.trim().length < 2 || !docHasText(draft.doc)} onClick={save}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Excluir resposta</DialogTitle>
          <p className="muted mt-1">Excluir &ldquo;{del?.title}&rdquo;? Esta ação não pode ser desfeita.</p>
          <div className="modal-actions">
            <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button variant="destructive" size="sm" disabled={pending} onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
