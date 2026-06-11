"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, ChevronDown, Plus, Pencil, Copy, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { ProfileFieldDialog } from "@/components/admin/profile-field-dialog";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { fieldTypeLabel } from "@/lib/profile-field-types";
import {
  createGroupAction,
  updateGroupAction,
  deleteGroupAction,
  deleteFieldAction,
  copyFieldAction,
} from "@/lib/actions/profile-field-actions";
import type { GroupWithFields, ProfileField } from "@/lib/admin/profile-fields";

export function ProfileFieldsManager({ groups }: { groups: GroupWithFields[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [open, setOpen] = useState<Set<number>>(() => new Set(groups.map((g) => g.id)));
  const [groupDialog, setGroupDialog] = useState<{ mode: "create" | "rename"; id?: number; name: string } | null>(null);
  const [groupPending, setGroupPending] = useState(false);
  const [fieldDialog, setFieldDialog] = useState<{ field: ProfileField | null; groupId: number } | null>(null);

  const groupOpts = groups.map((g) => ({ id: g.id, name: g.name }));

  function toggle(id: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function saveGroup() {
    if (!groupDialog) return;
    const name = groupDialog.name.trim();
    if (!name) { toast.error("Informe o nome."); return; }
    setGroupPending(true);
    const res = groupDialog.mode === "create" ? await createGroupAction(name) : await updateGroupAction(groupDialog.id!, name);
    setGroupPending(false);
    if (res.ok) {
      toast.success(groupDialog.mode === "create" ? "Grupo criado." : "Grupo salvo.");
      setGroupDialog(null);
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha.");
    }
  }

  async function removeGroup(id: number, name: string) {
    if (!(await confirm({ description: `Excluir o grupo "${name}" e todos os seus campos?`, confirmLabel: "Excluir", destructive: true }))) return;
    const res = await deleteGroupAction(id);
    if (res.ok) { toast.success("Grupo excluído."); router.refresh(); } else { toast.error(res.error ?? "Falha."); }
  }

  async function removeField(id: number, name: string) {
    if (!(await confirm({ description: `Excluir o campo "${name}"? Os valores dos membros serão perdidos.`, confirmLabel: "Excluir", destructive: true }))) return;
    const res = await deleteFieldAction(id);
    if (res.ok) { toast.success("Campo excluído."); router.refresh(); } else { toast.error(res.error ?? "Falha."); }
  }

  async function copyOneField(id: number) {
    const res = await copyFieldAction(id);
    if (res.ok) { toast.success("Campo copiado."); router.refresh(); } else { toast.error(res.error ?? "Falha."); }
  }

  return (
    <div>
      <div className="pf-toolbar">
        <Button size="sm" onClick={() => setGroupDialog({ mode: "create", name: "" })}>
          <Plus className="size-4" aria-hidden="true" /> Novo grupo
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="muted mt-4">Nenhum grupo de campos ainda. Crie um grupo para começar.</p>
      ) : (
        <ul className="pf-groups">
          {groups.map((g) => {
            const isOpen = open.has(g.id);
            return (
              <li key={g.id} className="pf-group">
                <div className="pf-group__head">
                  <button type="button" className="pf-group__toggle" onClick={() => toggle(g.id)} aria-expanded={isOpen}>
                    {isOpen ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
                    <span className="pf-group__name">{g.name}</span>
                    <span className="pf-group__count">{g.fields.length}</span>
                  </button>
                  <div className="pf-group__actions">
                    <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" title="Adicionar campo" onClick={() => setFieldDialog({ field: null, groupId: g.id })}>
                      <Plus className="size-4" aria-hidden="true" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" title="Renomear grupo" onClick={() => setGroupDialog({ mode: "rename", id: g.id, name: g.name })}>
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Excluir grupo" onClick={() => removeGroup(g.id, g.name)}>
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <ul className="pf-fields">
                    {g.fields.length === 0 ? (
                      <li className="pf-field pf-field--empty">Sem campos neste grupo.</li>
                    ) : (
                      g.fields.map((f) => (
                        <li key={f.id} className="pf-field">
                          <div className="min-w-0">
                            <span className="pf-field__name">{f.name}</span>
                            <span className="pf-field__meta">{fieldTypeLabel(f.type)}{f.required ? " · obrigatório" : ""}</span>
                          </div>
                          <div className="pf-field__actions">
                            <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" title="Editar" onClick={() => setFieldDialog({ field: f, groupId: f.groupId })}>
                              <Pencil className="size-4" aria-hidden="true" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" title="Copiar" onClick={() => copyOneField(f.id)}>
                              <Copy className="size-4" aria-hidden="true" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Excluir" onClick={() => removeField(f.id, f.name)}>
                              <X className="size-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Diálogo de grupo (criar/renomear) */}
      <Dialog open={groupDialog !== null} onOpenChange={(o) => !o && setGroupDialog(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>{groupDialog?.mode === "rename" ? "Renomear grupo" : "Novo grupo"}</DialogTitle>
          <div className="field mt-3">
            <Label htmlFor="pfg-name">Nome do grupo</Label>
            <Input id="pfg-name" value={groupDialog?.name ?? ""} onChange={(e) => setGroupDialog((p) => (p ? { ...p, name: e.target.value } : p))} maxLength={120} autoFocus />
          </div>
          <div className="modal-actions">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button type="button" size="sm" onClick={saveGroup} disabled={groupPending}>{groupPending ? "Salvando…" : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de campo */}
      {fieldDialog && (
        <ProfileFieldDialog
          open
          onOpenChange={(o) => !o && setFieldDialog(null)}
          groups={groupOpts}
          field={fieldDialog.field}
          defaultGroupId={fieldDialog.groupId}
        />
      )}
    </div>
  );
}
