"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pin, PinOff, Lock, LockOpen, EyeOff, Trash2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { bulkModerateTopicsAction, type BulkTopicAction } from "@/lib/actions/forum-mod-actions";

type Ctx = { selected: Set<number>; toggle: (id: number) => void };
const BulkCtx = createContext<Ctx | null>(null);

/** Caixa de seleção de uma linha de tópico (só renderiza dentro do provider). */
export function TopicCheckbox({ topicId }: { topicId: number }) {
  const ctx = useContext(BulkCtx);
  if (!ctx) return null;
  return (
    <Checkbox
      checked={ctx.selected.has(topicId)}
      onCheckedChange={() => ctx.toggle(topicId)}
      aria-label="Selecionar tópico para moderação"
      className="topic-row__check"
    />
  );
}

export function BulkModProvider({ forumSlug, children }: { forumSlug: string; children: React.ReactNode }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  const clear = () => setSelected(new Set());
  return (
    <BulkCtx.Provider value={{ selected, toggle }}>
      {children}
      {selected.size > 0 && <BulkBar ids={[...selected]} forumSlug={forumSlug} onClear={clear} />}
    </BulkCtx.Provider>
  );
}

const QUICK: { a: BulkTopicAction; label: string; Icon: typeof Pin }[] = [
  { a: "pin", label: "Fixar", Icon: Pin },
  { a: "unpin", label: "Desafixar", Icon: PinOff },
  { a: "lock", label: "Trancar", Icon: Lock },
  { a: "unlock", label: "Destrancar", Icon: LockOpen },
];

function BulkBar({ ids, forumSlug, onClear }: { ids: number[]; forumSlug: string; onClear: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState<null | "hide" | "delete">(null);

  function run(action: BulkTopicAction) {
    start(async () => {
      const res = await bulkModerateTopicsAction(ids, action, forumSlug);
      if (res.ok) { toast.success(`${ids.length} tópico(s) atualizados.`); onClear(); router.refresh(); }
      else toast.error(res.error ?? "Não foi possível concluir.");
    });
  }

  return (
    <div className="fbulk-bar" role="region" aria-label="Moderação em lote">
      <span className="fbulk-bar__count tabular-nums">{ids.length} selecionado(s)</span>
      {QUICK.map(({ a, label, Icon }) => (
        <Button key={a} variant="outline" size="sm" disabled={pending} onClick={() => run(a)}>
          <Icon className="size-4" aria-hidden="true" /> {label}
        </Button>
      ))}
      <Button variant="outline" size="sm" className="text-muted-foreground" disabled={pending} onClick={() => setConfirm("hide")}>
        <EyeOff className="size-4" aria-hidden="true" /> Ocultar
      </Button>
      <Button variant="outline" size="sm" className="text-destructive" disabled={pending} onClick={() => setConfirm("delete")}>
        <Trash2 className="size-4" aria-hidden="true" /> Excluir
      </Button>
      <Button variant="ghost" size="icon" className="size-8" aria-label="Limpar seleção" onClick={onClear}>
        <X className="size-4" aria-hidden="true" />
      </Button>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>{confirm === "delete" ? "Excluir tópicos" : "Ocultar tópicos"}</DialogTitle>
          <p className="muted mt-1">
            {confirm === "delete"
              ? `Excluir ${ids.length} tópico(s)? Eles somem da listagem.`
              : `Ocultar ${ids.length} tópico(s) do público?`}
          </p>
          <div className="modal-actions">
            <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button variant={confirm === "delete" ? "destructive" : "default"} size="sm" disabled={pending}
              onClick={() => { const c = confirm; setConfirm(null); if (c) run(c); }}>
              {confirm === "delete" ? "Excluir" : "Ocultar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
