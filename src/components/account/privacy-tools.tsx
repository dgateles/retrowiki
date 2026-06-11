"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { exportMyDataAction, requestDeletionAction } from "@/lib/actions/privacy-actions";

export function PrivacyTools({ hasOpenRequest }: { hasOpenRequest: boolean }) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [requested, setRequested] = useState(hasOpenRequest);

  async function exportData() {
    setExporting(true);
    const res = await exportMyDataAction();
    setExporting(false);
    if (!res.ok || !res.data) { toast.error(res.error ?? "Falha ao exportar."); return; }
    const blob = new Blob([res.data.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "retrowiki-meus-dados.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download iniciado.");
  }

  async function requestDeletion() {
    setPending(true);
    const res = await requestDeletionAction(reason);
    setPending(false);
    if (res.ok) { toast.success("Pedido de exclusão registrado."); setOpen(false); setRequested(true); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <div className="privacy-tools">
      <div className="settings-row">
        <div>
          <p className="settings-row__label">Baixar meus dados</p>
          <p className="settings-row__value muted">Uma cópia em JSON da sua conta, conteúdo e registros (LGPD).</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={exportData} disabled={exporting}>
          <Download className="size-4" aria-hidden="true" /> {exporting ? "Gerando…" : "Baixar"}
        </Button>
      </div>

      <div className="settings-row">
        <div>
          <p className="settings-row__label">Excluir minha conta</p>
          <p className="settings-row__value muted">Seus dados pessoais são removidos. O conteúdo público fica como "Usuário removido".</p>
        </div>
        {requested ? (
          <span className="muted text-sm">Pedido em análise</span>
        ) : (
          <Button type="button" size="sm" variant="destructive" onClick={() => setOpen(true)}>
            <Trash2 className="size-4" aria-hidden="true" /> Solicitar exclusão
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Solicitar exclusão da conta</DialogTitle>
          <p className="muted text-sm">O pedido é revisado pela equipe. Após concluído, seus dados pessoais são apagados e não há como reverter.</p>
          <div className="member-create">
            <div className="field">
              <Label htmlFor="del-reason">Motivo (opcional)</Label>
              <Textarea id="del-reason" rows={3} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <div className="modal-actions">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button type="button" variant="destructive" size="sm" onClick={requestDeletion} disabled={pending}>{pending ? "Enviando…" : "Confirmar pedido"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
