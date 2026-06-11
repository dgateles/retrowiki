"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { assignContentAction } from "@/lib/actions/assignment-actions";

type Opt = { id: number; name: string };

export function AssignButton({ articleId, mods, teams }: { articleId: number; mods: Opt[]; teams: Opt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // value codificado "user:ID" ou "team:ID"
  const first = mods[0] ? `user:${mods[0].id}` : teams[0] ? `team:${teams[0].id}` : "";
  const [assignee, setAssignee] = useState(first);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  if (mods.length === 0 && teams.length === 0) return null;

  async function submit() {
    const [type, idStr] = assignee.split(":");
    const id = Number(idStr);
    if ((type !== "user" && type !== "team") || !id) { toast.error("Escolha um destino."); return; }
    setPending(true);
    const res = await assignContentAction(articleId, type as "user" | "team", id, note);
    setPending(false);
    if (res.ok) { toast.success("Conteúdo atribuído."); setOpen(false); setNote(""); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" aria-hidden="true" /> Atribuir
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Atribuir guia</DialogTitle>
          <div className="member-create">
            <div className="field">
              <Label htmlFor="ab-assignee">Atribuir a</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger id="ab-assignee" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mods.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Moderadores</SelectLabel>
                      {mods.map((m) => <SelectItem key={`u${m.id}`} value={`user:${m.id}`}>{m.name}</SelectItem>)}
                    </SelectGroup>
                  )}
                  {teams.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Equipes</SelectLabel>
                      {teams.map((t) => <SelectItem key={`t${t.id}`} value={`team:${t.id}`}>{t.name}</SelectItem>)}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="field"><Label htmlFor="ab-note">Nota (opcional)</Label><Textarea id="ab-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></div>
          </div>
          <div className="modal-actions">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button type="button" size="sm" onClick={submit} disabled={pending}>{pending ? "Atribuindo…" : "Atribuir"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
