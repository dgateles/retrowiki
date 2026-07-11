"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { savePrefixAction, deletePrefixAction } from "@/lib/actions/forum-prefixes-actions";
import type { Prefix } from "@/lib/forum-prefixes";
import { PREFIX_CHIP_CLASS, FORUM_PREFIX_COLORS, type ForumPrefixColor } from "@/lib/forum-prefix-style";
import { cn } from "@/lib/utils";

type Draft = { id?: number; label: string; color: ForumPrefixColor; sortOrder: number };

export function ForumPrefixesManager({ prefixes }: { prefixes: Prefix[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [del, setDel] = useState<{ id: number; label: string } | null>(null);

  const newDraft = (): Draft => ({ label: "", color: "slate", sortOrder: prefixes.length });

  function save() {
    if (!draft || draft.label.trim().length < 2) return;
    start(async () => {
      const res = await savePrefixAction(draft);
      if (res.ok) { toast.success("Prefixo salvo."); setDraft(null); router.refresh(); }
      else toast.error(res.error ?? "Falha.");
    });
  }
  function confirmDelete() {
    if (!del) return;
    start(async () => {
      const res = await deletePrefixAction(del.id);
      if (res.ok) { toast.success("Prefixo excluído."); setDel(null); router.refresh(); }
      else toast.error(res.error ?? "Falha.");
    });
  }

  return (
    <section className="mt-10" aria-labelledby="prefixes-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="prefixes-title" className="text-lg font-semibold">Prefixos de tópico</h2>
          <p className="muted text-sm">Rótulos coloridos exibidos antes do título (ex.: Resolvido, Dúvida, Aviso).</p>
        </div>
        <Button size="sm" onClick={() => setDraft(newDraft())}><Plus className="size-4" aria-hidden="true" /> Novo prefixo</Button>
      </div>

      {prefixes.length === 0 ? (
        <Empty className="mt-4">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Tag aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>Nenhum prefixo</EmptyTitle>
            <EmptyDescription>Crie prefixos para organizar os tópicos por tipo.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {prefixes.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", PREFIX_CHIP_CLASS[p.color])}>{p.label}</span>
              <span className="muted text-xs">ordem {p.sortOrder} · /{p.slug}</span>
              <div className="ml-auto flex gap-1">
                <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" aria-label={`Editar ${p.label}`} onClick={() => setDraft({ id: p.id, label: p.label, color: p.color, sortOrder: p.sortOrder })}><Pencil className="size-4" aria-hidden="true" /></Button>
                <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Excluir ${p.label}`} onClick={() => setDel({ id: p.id, label: p.label })}><Trash2 className="size-4" aria-hidden="true" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Editor de prefixo */}
      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>{draft?.id ? "Editar prefixo" : "Novo prefixo"}</DialogTitle>
          {draft && (
            <div className="mt-2 space-y-4">
              <div className="field">
                <Label htmlFor="prefix-label">Rótulo</Label>
                <Input id="prefix-label" value={draft.label} maxLength={40} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="Ex.: Resolvido" />
              </div>
              <div className="field">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cor do prefixo">
                  {FORUM_PREFIX_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={draft.color === c}
                      aria-label={c}
                      onClick={() => setDraft({ ...draft, color: c })}
                      className={cn("rounded px-2.5 py-1 text-xs font-semibold ring-offset-2 transition", PREFIX_CHIP_CLASS[c], draft.color === c && "ring-2 ring-ring")}
                    >
                      {draft.label.trim() || "Prefixo"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <Label htmlFor="prefix-order">Ordem</Label>
                <Input id="prefix-order" type="number" min={0} max={999} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })} className="w-28" />
              </div>
              <div className="modal-actions">
                <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
                <Button size="sm" disabled={pending || draft.label.trim().length < 2} onClick={save}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Excluir prefixo</DialogTitle>
          <p className="muted mt-1">Excluir “{del?.label}”? Os tópicos que o usam ficam sem prefixo.</p>
          <div className="modal-actions">
            <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button variant="destructive" size="sm" disabled={pending} onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
