"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";
import { MoreHorizontal, Link2, Flag, Pencil, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { RichEditor } from "@/components/editor/rich-editor";
import { docHasText } from "@/components/engagement/comment-form";
import { editForumPostAction } from "@/lib/actions/forum-actions";
import { hidePostAction, deletePostAction } from "@/lib/actions/forum-mod-actions";
import { reportContentAction } from "@/lib/actions/report-actions";

type ReportTypeOpt = { id: number; title: string };
type Dlg = null | "report" | "edit" | "hide" | "delete";

/** Menu "…" de ações da postagem (estilo IPB): compartilhar, denunciar, editar,
 * ocultar e excluir — o que o visitante pode fazer depende das permissões. */
export function PostActionsMenu({
  postId,
  permalink,
  initialDoc,
  canReport,
  reportTypes,
  reportMessageMandatory = false,
  canEdit,
  canModerate,
  isFirst,
}: {
  postId: number;
  permalink: string;
  initialDoc: JSONContent;
  canReport: boolean;
  reportTypes: ReportTypeOpt[];
  reportMessageMandatory?: boolean;
  canEdit: boolean;
  canModerate: boolean;
  isFirst: boolean;
}) {
  const router = useRouter();
  const [dlg, setDlg] = useState<Dlg>(null);
  const [pending, start] = useTransition();

  // Editar
  const [doc, setDoc] = useState<JSONContent>(initialDoc);
  // Denunciar
  const [typeId, setTypeId] = useState<number>(reportTypes[0]?.id ?? 0);
  const [message, setMessage] = useState("");

  const canModHere = canModerate && !isFirst;

  function share() {
    const url = typeof window !== "undefined" ? window.location.origin + permalink : permalink;
    navigator.clipboard?.writeText(url).then(
      () => toast.success("Link da postagem copiado."),
      () => toast.error("Não foi possível copiar."),
    );
  }

  function submitEdit() {
    if (!docHasText(doc)) return;
    start(async () => {
      const res = await editForumPostAction({ postId, body: JSON.stringify(doc) });
      if (res.ok) { toast.success("Postagem editada."); setDlg(null); router.refresh(); }
      else toast.error(res.error ?? "Falha ao editar.");
    });
  }

  function submitReport() {
    if (reportMessageMandatory && message.trim().length === 0) { toast.error("A mensagem é obrigatória."); return; }
    start(async () => {
      const res = await reportContentAction("forum_post", postId, typeId, message);
      if (res.ok) { toast.success("Denúncia enviada à moderação."); setDlg(null); setMessage(""); }
      else toast.error(res.error ?? "Falha ao denunciar.");
    });
  }

  function runMod(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    start(async () => {
      const res = await fn();
      if (res.ok) { toast.success(okMsg); setDlg(null); router.refresh(); }
      else toast.error(res.error ?? "Falha.");
    });
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button type="button" className="fpost__more" aria-label="Ações da postagem">
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={share}><Link2 className="size-4" aria-hidden="true" /> Compartilhar</DropdownMenuItem>
          {canReport && reportTypes.length > 0 && (
            <DropdownMenuItem onSelect={() => setDlg("report")}><Flag className="size-4" aria-hidden="true" /> Denunciar</DropdownMenuItem>
          )}
          {(canEdit || canModHere) && <DropdownMenuSeparator />}
          {canEdit && <DropdownMenuItem onSelect={() => { setDoc(initialDoc); setDlg("edit"); }}><Pencil className="size-4" aria-hidden="true" /> Editar</DropdownMenuItem>}
          {canModHere && <DropdownMenuItem onSelect={() => setDlg("hide")}><EyeOff className="size-4" aria-hidden="true" /> Ocultar</DropdownMenuItem>}
          {canModHere && <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDlg("delete")}><Trash2 className="size-4" aria-hidden="true" /> Excluir</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Editar */}
      <Dialog open={dlg === "edit"} onOpenChange={(o) => !o && setDlg(null)}>
        <DialogContent aria-describedby={undefined} className="max-w-2xl">
          <DialogTitle>Editar postagem</DialogTitle>
          <div className="mt-3">
            <RichEditor value={doc} onChange={setDoc} variant="full" placeholder="Edite sua mensagem…" />
          </div>
          <div className="modal-actions">
            <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button size="sm" disabled={pending || !docHasText(doc)} onClick={submitEdit}>{pending ? "Salvando…" : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Denunciar */}
      <Dialog open={dlg === "report"} onOpenChange={(o) => !o && setDlg(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Denunciar postagem</DialogTitle>
          <div className="member-create">
            <div className="field">
              <Label htmlFor="fp-rp-type">Motivo</Label>
              <Select value={String(typeId)} onValueChange={(v) => setTypeId(Number(v))}>
                <SelectTrigger id="fp-rp-type" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{reportTypes.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="field">
              <Label htmlFor="fp-rp-msg">Mensagem{reportMessageMandatory ? " *" : " (opcional)"}</Label>
              <Textarea id="fp-rp-msg" rows={3} value={message} maxLength={1000} onChange={(e) => setMessage(e.target.value)} />
            </div>
          </div>
          <div className="modal-actions">
            <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button size="sm" onClick={submitReport} disabled={pending}>{pending ? "Enviando…" : "Enviar denúncia"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ocultar / Excluir */}
      <Dialog open={dlg === "hide" || dlg === "delete"} onOpenChange={(o) => !o && setDlg(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>{dlg === "delete" ? "Excluir postagem" : "Ocultar postagem"}</DialogTitle>
          <p className="muted mt-1">{dlg === "delete" ? "Excluir esta postagem?" : "Ocultar esta postagem do público?"}</p>
          <div className="modal-actions">
            <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button variant={dlg === "delete" ? "destructive" : "default"} size="sm" disabled={pending}
              onClick={() => { if (dlg === "delete") runMod(() => deletePostAction(postId), "Postagem excluída."); else runMod(() => hidePostAction(postId), "Postagem oculta."); }}>
              {dlg === "delete" ? "Excluir" : "Ocultar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
