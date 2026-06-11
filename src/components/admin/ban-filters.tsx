"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { createBanFilterAction, deleteBanFilterAction } from "@/lib/actions/ban-actions";
import { BAN_TYPE_LABEL, type BanFilter, type BanType } from "@/lib/ban-types";
import { useConfirm } from "@/components/admin/confirm-dialog";

const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

export function BanFilters({ filters }: { filters: BanFilter[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<BanType>("ip");
  const [content, setContent] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  async function save() {
    if (content.trim().length < 1) { toast.error("Informe o conteúdo."); return; }
    setPending(true);
    const res = await createBanFilterAction(JSON.stringify({ type, content, reason }));
    setPending(false);
    if (res.ok) {
      toast.success("Filtro adicionado.");
      setOpen(false); setContent(""); setReason(""); setType("ip");
      router.refresh();
    } else toast.error(res.error ?? "Falha.");
  }

  async function remove(id: number) {
    if (!(await confirm({ description: "Excluir este filtro de banimento?", confirmLabel: "Excluir", destructive: true }))) return;
    const res = await deleteBanFilterAction(id);
    if (res.ok) { toast.success("Filtro excluído."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <div className="mt-6">
      <div className="pf-toolbar">
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" aria-hidden="true" /> Adicionar filtro</Button>
      </div>

      {filters.length === 0 ? (
        <p className="muted mt-4">Nenhum filtro de banimento.</p>
      ) : (
        <div className="bantable mt-4">
          <div className="bantable__head">
            <span>Tipo</span><span>Conteúdo</span><span>Motivo</span><span>Adicionado</span><span className="sr-only">Ações</span>
          </div>
          {filters.map((f) => (
            <div key={f.id} className="bantable__row">
              <span>{BAN_TYPE_LABEL[f.type]}</span>
              <span className="bantable__content">{f.content}</span>
              <span className="muted">{f.reason || "—"}</span>
              <span className="muted">{fmt(f.createdAt)}</span>
              <button type="button" className="pf-icon pf-icon--danger" title="Excluir" onClick={() => remove(f.id)}><X className="size-4" aria-hidden="true" /></button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Adicionar filtro de banimento</DialogTitle>
          <div className="member-create">
            <div className="field">
              <Label htmlFor="bf-type">Tipo</Label>
              <select id="bf-type" className="rte__select" value={type} onChange={(e) => setType(e.target.value as BanType)}>
                <option value="ip">Endereço IP</option>
                <option value="email">E-mail</option>
                <option value="name">Nome de usuário</option>
              </select>
            </div>
            <div className="field">
              <Label htmlFor="bf-content">Conteúdo</Label>
              <Input id="bf-content" value={content} onChange={(e) => setContent(e.target.value)} maxLength={255} />
              <p className="field__hint">Use <code>*</code> como curinga (ex.: <code>200.1.*</code> ou <code>*@spam.com</code>).</p>
            </div>
            <div className="field">
              <Label htmlFor="bf-reason">Motivo (opcional)</Label>
              <Input id="bf-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} />
            </div>
          </div>
          <div className="modal-actions">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
