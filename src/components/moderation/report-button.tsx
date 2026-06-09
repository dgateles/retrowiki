"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { reportContentAction } from "@/lib/actions/report-actions";

type ReportTypeOpt = { id: number; title: string };

export function ReportButton({
  targetType,
  targetId,
  reportTypes,
  messageMandatory = false,
  variant = "link",
}: {
  targetType: "article" | "comment";
  targetId: number;
  reportTypes: ReportTypeOpt[];
  messageMandatory?: boolean;
  variant?: "link" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const [typeId, setTypeId] = useState<number>(reportTypes[0]?.id ?? 0);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  if (reportTypes.length === 0) return null;

  async function submit() {
    if (messageMandatory && message.trim().length === 0) {
      toast.error("A mensagem é obrigatória.");
      return;
    }
    setPending(true);
    const res = await reportContentAction(targetType, targetId, typeId, message);
    setPending(false);
    if (res.ok) {
      toast.success("Denúncia enviada à moderação.");
      setOpen(false);
      setMessage("");
    } else {
      toast.error(res.error ?? "Falha ao denunciar.");
    }
  }

  return (
    <>
      <button type="button" className="report-trigger" onClick={() => setOpen(true)} title="Denunciar">
        <Flag className="size-4" aria-hidden="true" />
        {variant === "link" && <span>Denunciar</span>}
        {variant === "icon" && <span className="sr-only">Denunciar</span>}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Denunciar conteúdo</DialogTitle>
          <div className="member-create">
            <div className="field">
              <Label htmlFor="rp-type">Motivo</Label>
              <select id="rp-type" className="rte__select" value={typeId} onChange={(e) => setTypeId(Number(e.target.value))}>
                {reportTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <Label htmlFor="rp-msg">Mensagem{messageMandatory ? " *" : " (opcional)"}</Label>
              <textarea id="rp-msg" className="q-textarea" rows={3} value={message} maxLength={1000} onChange={(e) => setMessage(e.target.value)} />
            </div>
          </div>
          <div className="modal-actions">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button type="button" size="sm" onClick={submit} disabled={pending}>{pending ? "Enviando…" : "Enviar denúncia"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
