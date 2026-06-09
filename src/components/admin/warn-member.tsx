"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { warnMemberAction } from "@/lib/actions/warning-actions";

type ReasonOpt = { id: number; name: string; points: number; defaultNote: string };

export function WarnMember({ userId, reasons }: { userId: number; reasons: ReasonOpt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reasonId, setReasonId] = useState<number>(reasons[0]?.id ?? 0);
  const [points, setPoints] = useState<string>(String(reasons[0]?.points ?? 1));
  const [note, setNote] = useState(reasons[0]?.defaultNote ?? "");
  const [pending, setPending] = useState(false);

  if (reasons.length === 0) return null;

  function onReasonChange(id: number) {
    setReasonId(id);
    const r = reasons.find((x) => x.id === id);
    if (r) { setPoints(String(r.points)); setNote(r.defaultNote); }
  }

  async function submit() {
    setPending(true);
    const res = await warnMemberAction(userId, reasonId, Number(points), note);
    setPending(false);
    if (res.ok) { toast.success("Advertência aplicada."); setOpen(false); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <TriangleAlert className="size-4" aria-hidden="true" /> Advertir
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Advertir membro</DialogTitle>
          <div className="member-create">
            <div className="field">
              <Label htmlFor="wm-reason">Motivo</Label>
              <select id="wm-reason" className="rte__select" value={reasonId} onChange={(e) => onReasonChange(Number(e.target.value))}>
                {reasons.map((r) => (<option key={r.id} value={r.id}>{r.name} ({r.points} pt)</option>))}
              </select>
            </div>
            <div className="field"><Label htmlFor="wm-points">Pontos</Label><Input id="wm-points" type="number" min={0} className="w-32" value={points} onChange={(e) => setPoints(e.target.value)} /></div>
            <div className="field"><Label htmlFor="wm-note">Nota</Label><textarea id="wm-note" className="q-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></div>
          </div>
          <div className="modal-actions">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button type="button" size="sm" onClick={submit} disabled={pending}>{pending ? "Aplicando…" : "Aplicar advertência"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
