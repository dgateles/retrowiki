"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, X, UserPlus, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
  addEntryAction,
  updateEntryAction,
  deleteEntryAction,
  moveEntryAction,
} from "@/lib/actions/staff-directory-actions";
import type { CategoryRow, EntryRow, Layout } from "@/lib/staff-directory";

const LAYOUTS: { value: Layout; label: string }[] = [
  { value: "grid", label: "Grade (cards)" },
  { value: "list", label: "Lista (linhas)" },
  { value: "twocol", label: "Duas colunas" },
];
const ROLES = [
  { value: "admin", label: "Administradores" },
  { value: "moderator", label: "Moderadores" },
  { value: "contributor", label: "Colaboradores" },
  { value: "member", label: "Membros" },
];

type CategoryWithEntries = CategoryRow & { entries: EntryRow[] };

export function StaffDirectoryAdmin({ categories }: { categories: CategoryWithEntries[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [catDialog, setCatDialog] = useState<{ c: CategoryRow | null } | null>(null);
  const [entryDialog, setEntryDialog] = useState<{ categoryId: number; entry: EntryRow | null } | null>(null);

  async function removeCat(id: number, title: string) {
    if (!(await confirm({ description: `Excluir a categoria "${title}" e suas entradas?`, confirmLabel: "Excluir", destructive: true }))) return;
    const res = await deleteCategoryAction(id);
    if (res.ok) { toast.success("Categoria excluída."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function removeEntry(id: number) {
    if (!(await confirm({ description: "Remover esta entrada?", confirmLabel: "Remover", destructive: true }))) return;
    const res = await deleteEntryAction(id);
    if (res.ok) { toast.success("Entrada removida."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function moveCat(id: number, dir: number) {
    const res = await moveCategoryAction(id, dir);
    if (res.ok) router.refresh(); else toast.error(res.error ?? "Falha.");
  }
  async function moveEnt(id: number, dir: number) {
    const res = await moveEntryAction(id, dir);
    if (res.ok) router.refresh(); else toast.error(res.error ?? "Falha.");
  }

  return (
    <div className="mt-6">
      <div className="pf-toolbar">
        <Button size="sm" onClick={() => setCatDialog({ c: null })}><Plus className="size-4" aria-hidden="true" /> Nova categoria</Button>
      </div>

      {categories.length === 0 ? (
        <p className="muted mt-4">Nenhuma categoria. Crie uma e adicione membros ou grupos.</p>
      ) : (
        <ul className="pf-groups mt-4">
          {categories.map((c, ci) => (
            <li key={c.id} className="pf-group">
              <div className="pf-group__head">
                <span className="min-w-0"><span className="pf-group__name">{c.title}</span><span className="pf-field__meta block">{LAYOUTS.find((l) => l.value === c.layout)?.label} · {c.entries.length} entrada(s)</span></span>
                <div className="pf-group__actions">
                  <button type="button" className="pf-icon" title="Subir" disabled={ci === 0} onClick={() => moveCat(c.id, -1)}><ChevronUp className="size-4" aria-hidden="true" /></button>
                  <button type="button" className="pf-icon" title="Descer" disabled={ci === categories.length - 1} onClick={() => moveCat(c.id, 1)}><ChevronDown className="size-4" aria-hidden="true" /></button>
                  <button type="button" className="pf-icon" title="Adicionar membro ou grupo" onClick={() => setEntryDialog({ categoryId: c.id, entry: null })}><UserPlus className="size-4" aria-hidden="true" /></button>
                  <button type="button" className="pf-icon" title="Editar categoria" onClick={() => setCatDialog({ c })}><Pencil className="size-4" aria-hidden="true" /></button>
                  <button type="button" className="pf-icon pf-icon--danger" title="Excluir categoria" onClick={() => removeCat(c.id, c.title)}><X className="size-4" aria-hidden="true" /></button>
                </div>
              </div>
              {c.entries.length > 0 && (
                <ul className="pf-fields">
                  {c.entries.map((e, ei) => (
                    <li key={e.id} className="pf-field">
                      <span className="min-w-0">
                        <span className="pf-field__label">{e.type === "group" ? `Grupo: ${ROLES.find((r) => r.value === e.groupRole)?.label ?? e.groupRole}` : (e.customName || e.memberName || "Membro")}</span>
                        <span className="pf-field__meta">{e.type === "member" ? (e.customTitle || "membro") : "atualiza automaticamente"}</span>
                      </span>
                      <span className="pf-field__actions">
                        <button type="button" className="pf-icon" title="Subir" disabled={ei === 0} onClick={() => moveEnt(e.id, -1)}><ChevronUp className="size-4" aria-hidden="true" /></button>
                        <button type="button" className="pf-icon" title="Descer" disabled={ei === c.entries.length - 1} onClick={() => moveEnt(e.id, 1)}><ChevronDown className="size-4" aria-hidden="true" /></button>
                        <button type="button" className="pf-icon" title="Editar" onClick={() => setEntryDialog({ categoryId: c.id, entry: e })}><Pencil className="size-4" aria-hidden="true" /></button>
                        <button type="button" className="pf-icon pf-icon--danger" title="Remover" onClick={() => removeEntry(e.id)}><X className="size-4" aria-hidden="true" /></button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {catDialog && <CategoryDialog category={catDialog.c} onClose={() => setCatDialog(null)} onSaved={() => { setCatDialog(null); router.refresh(); }} />}
      {entryDialog && <EntryDialog categoryId={entryDialog.categoryId} entry={entryDialog.entry} onClose={() => setEntryDialog(null)} onSaved={() => { setEntryDialog(null); router.refresh(); }} />}
    </div>
  );
}

function CategoryDialog({ category, onClose, onSaved }: { category: CategoryRow | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(category?.title ?? "");
  const [layout, setLayout] = useState<Layout>(category?.layout ?? "grid");
  const [pending, setPending] = useState(false);

  async function save() {
    if (title.trim().length < 1) { toast.error("Informe o título."); return; }
    setPending(true);
    const body = JSON.stringify({ title, layout });
    const res = category ? await updateCategoryAction(category.id, body) : await createCategoryAction(body);
    setPending(false);
    if (res.ok) { toast.success(category ? "Categoria salva." : "Categoria criada."); onSaved(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        <div className="member-create">
          <div className="field"><Label htmlFor="sc-title">Título</Label><Input id="sc-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} /></div>
          <div className="field">
            <Label htmlFor="sc-layout">Layout</Label>
            <Select value={layout} onValueChange={(v) => setLayout(v as Layout)}>
              <SelectTrigger id="sc-layout" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LAYOUTS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="modal-actions">
          <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
          <Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EntryDialog({ categoryId, entry, onClose, onSaved }: { categoryId: number; entry: EntryRow | null; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<"member" | "group">(entry?.type ?? "member");
  const [handle, setHandle] = useState(entry?.type === "member" ? "" : "");
  const [groupRole, setGroupRole] = useState(entry?.groupRole ?? "admin");
  const [customName, setCustomName] = useState(entry?.customName ?? "");
  const [customTitle, setCustomTitle] = useState(entry?.customTitle ?? "");
  const [bio, setBio] = useState(entry?.bio ?? "");
  const [pending, setPending] = useState(false);

  async function save() {
    if (type === "member" && !entry && handle.trim().length < 1) { toast.error("Informe o usuário (handle)."); return; }
    setPending(true);
    const body = JSON.stringify({ type, handle: handle.trim(), groupRole, customName, customTitle, bio });
    const res = entry ? await updateEntryAction(entry.id, body) : await addEntryAction(categoryId, body);
    setPending(false);
    if (res.ok) { toast.success(entry ? "Entrada salva." : "Entrada adicionada."); onSaved(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] overflow-y-auto">
        <DialogTitle>{entry ? "Editar entrada" : "Adicionar ao diretório"}</DialogTitle>
        <div className="member-create">
          <div className="field">
            <Label>Tipo</Label>
            <div className="rule-form__roles">
              <label className="rule-form__check"><input type="radio" name="entry-type" checked={type === "member"} onChange={() => setType("member")} /> Membro (nome, título e bio personalizados)</label>
              <label className="rule-form__check"><input type="radio" name="entry-type" checked={type === "group"} onChange={() => setType("group")} /> Grupo (atualiza automaticamente)</label>
            </div>
          </div>

          {type === "member" ? (
            <>
              <div className="field">
                <Label htmlFor="se-handle">Usuário (handle){entry ? " — em branco mantém" : ""}</Label>
                <Input id="se-handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="ex.: retrowiki" />
              </div>
              <div className="field"><Label htmlFor="se-name">Nome a exibir (em branco = nome do membro)</Label><Input id="se-name" value={customName} onChange={(e) => setCustomName(e.target.value)} maxLength={120} /></div>
              <div className="field"><Label htmlFor="se-title">Título personalizado</Label><Input id="se-title" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} maxLength={160} placeholder="ex.: Fundador" /></div>
              <div className="field"><Label htmlFor="se-bio">Biografia</Label><Textarea id="se-bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={2000} /></div>
            </>
          ) : (
            <div className="field">
              <Label htmlFor="se-role">Grupo</Label>
              <Select value={groupRole} onValueChange={setGroupRole}>
                <SelectTrigger id="se-role" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
          <Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
