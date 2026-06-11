"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { MenuIcon } from "@/components/layout/menu-icon";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { ICON_KEYS, ICON_LABELS, type IconKey } from "@/lib/page-icons";
import type { MenuItem, MenuLocation } from "@/lib/menu";
import {
  createMenuItemAction,
  updateMenuItemAction,
  deleteMenuItemAction,
  setMenuItemVisibleAction,
  moveMenuItemAction,
  seedMenuDefaultsAction,
} from "@/lib/actions/menu-actions";

type TypeOpt = "link" | "flyout" | "dropdown";
const TYPE_LABEL: Record<TypeOpt, string> = { link: "Link", flyout: "Flyout", dropdown: "Dropdown" };

type DialogState =
  | { mode: "new"; location: MenuLocation; parentId: number | null; parentType: TypeOpt | null }
  | { mode: "edit"; item: MenuItem; isChild: boolean };

export function MenuManager({ header, footer }: { header: MenuItem[]; footer: MenuItem[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [loc, setLoc] = useState<MenuLocation>("header");
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [pending, setPending] = useState(false);

  const all = loc === "header" ? header : footer;
  const tops = all.filter((i) => i.parentId == null);
  const childrenOf = (id: number) => all.filter((i) => i.parentId === id);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    setPending(true);
    const res = await fn();
    setPending(false);
    if (res.ok) {
      toast.success(ok);
      setDialog(null);
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha.");
    }
  }

  async function remove(item: MenuItem) {
    const childCount = childrenOf(item.id).length;
    const extra = childCount ? ` e ${childCount} subitem(ns)` : "";
    if (!(await confirm({ description: `Excluir "${item.label}"${extra}?`, confirmLabel: "Excluir", destructive: true }))) return;
    run(() => deleteMenuItemAction(item.id), "Item excluído.");
  }

  return (
    <div className="mt-6">
      <div className="perm-form__tabs" role="tablist" aria-label="Localização do menu">
        {(["header", "footer"] as const).map((l) => (
          <button key={l} role="tab" aria-selected={loc === l} className={`perm-form__tab ${loc === l ? "perm-form__tab--active" : ""}`} onClick={() => setLoc(l)}>
            {l === "header" ? "Header" : "Footer"}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tops.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-6">
            <p className="muted">Nenhum item no {loc === "header" ? "header" : "footer"} ainda.</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setDialog({ mode: "new", location: loc, parentId: null, parentType: null })}>
                <Plus className="size-4" aria-hidden="true" /> Adicionar item
              </Button>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => seedMenuDefaultsAction(loc), "Padrão restaurado.")}>
                Restaurar padrão
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tops.map((item, idx) => {
              const kids = childrenOf(item.id);
              const canChild = item.type === "flyout" || item.type === "dropdown";
              return (
                <div key={item.id} className="rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex flex-col">
                      <Button type="button" variant="ghost" size="icon" className="size-6 text-muted-foreground" aria-label="Mover para cima" disabled={idx === 0 || pending} onClick={() => run(() => moveMenuItemAction(item.id, -1), "Reordenado.")}>
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="size-6 text-muted-foreground" aria-label="Mover para baixo" disabled={idx === tops.length - 1 || pending} onClick={() => run(() => moveMenuItemAction(item.id, 1), "Reordenado.")}>
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.label}</span>
                        <Badge variant="secondary">{TYPE_LABEL[item.type]}</Badge>
                      </div>
                      {item.href && <p className="truncate text-xs text-muted-foreground">{item.href}</p>}
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch checked={item.visible} disabled={pending} onCheckedChange={(c) => run(() => setMenuItemVisibleAction(item.id, c), "Atualizado.")} /> Visível
                    </label>
                    {canChild && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setDialog({ mode: "new", location: loc, parentId: item.id, parentType: item.type })}>
                        <CornerDownRight className="size-4" aria-hidden="true" /> Subitem
                      </Button>
                    )}
                    <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" aria-label={`Editar ${item.label}`} onClick={() => setDialog({ mode: "edit", item, isChild: false })}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Excluir ${item.label}`} onClick={() => remove(item)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  {kids.length > 0 && (
                    <ul className="divide-y divide-border border-t border-border">
                      {kids.map((c, ci) => (
                        <li key={c.id} className="flex items-center gap-3 py-2 pl-10 pr-3">
                          <div className="flex flex-col">
                            <Button type="button" variant="ghost" size="icon" className="size-6 text-muted-foreground" aria-label="Mover para cima" disabled={ci === 0 || pending} onClick={() => run(() => moveMenuItemAction(c.id, -1), "Reordenado.")}>
                              <ArrowUp className="size-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="size-6 text-muted-foreground" aria-label="Mover para baixo" disabled={ci === kids.length - 1 || pending} onClick={() => run(() => moveMenuItemAction(c.id, 1), "Reordenado.")}>
                              <ArrowDown className="size-4" />
                            </Button>
                          </div>
                          {c.icon && <span className="flex size-7 items-center justify-center rounded-md border border-border bg-muted/40"><MenuIcon name={c.icon} className="size-4 text-primary" /></span>}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{c.label}</p>
                            <p className="truncate text-xs text-muted-foreground">{c.href}{c.description ? ` · ${c.description}` : ""}</p>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" aria-label={`Editar ${c.label}`} onClick={() => setDialog({ mode: "edit", item: c, isChild: true })}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Excluir ${c.label}`} onClick={() => remove(c)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            <div>
              <Button size="sm" variant="outline" onClick={() => setDialog({ mode: "new", location: loc, parentId: null, parentType: null })}>
                <Plus className="size-4" aria-hidden="true" /> Adicionar item
              </Button>
            </div>
          </div>
        )}
      </div>

      {dialog && <ItemDialog key={dialog.mode === "edit" ? dialog.item.id : `new-${dialog.parentId}`} state={dialog} onClose={() => setDialog(null)} run={run} pending={pending} />}
    </div>
  );
}

function ItemDialog({
  state,
  onClose,
  run,
  pending,
}: {
  state: DialogState;
  onClose: () => void;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => void;
  pending: boolean;
}) {
  const editing = state.mode === "edit";
  const item = editing ? state.item : null;
  const isChild = editing ? state.isChild : state.parentId != null;
  // Itens-filho mostram ícone/descrição (úteis em flyout). Itens de topo mostram tipo.
  const showIcon = isChild;

  const [label, setLabel] = useState(item?.label ?? "");
  const [href, setHref] = useState(item?.href ?? "");
  const [type, setType] = useState<TypeOpt>((item?.type as TypeOpt) ?? "link");
  const [icon, setIcon] = useState<string>(item?.icon ?? "none");
  const [description, setDescription] = useState(item?.description ?? "");

  function save() {
    const payload = {
      location: editing ? undefined : (state as { location: MenuLocation }).location,
      parentId: editing ? item!.parentId : (state as { parentId: number | null }).parentId,
      label,
      href,
      type: isChild ? "link" : type,
      icon: icon === "none" ? "" : icon,
      description,
    };
    const body = JSON.stringify(payload);
    if (editing) run(() => updateMenuItemAction(item!.id, body), "Item salvo.");
    else run(() => createMenuItemAction(body), "Item criado.");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>{editing ? "Editar item" : isChild ? "Novo subitem" : "Novo item"}</DialogTitle>
        <div className="member-create">
          <div className="field">
            <Label htmlFor="mi-label">Rótulo</Label>
            <Input id="mi-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} />
          </div>
          <div className="field">
            <Label htmlFor="mi-href">Link {isChild ? "" : "(opcional para flyout/dropdown)"}</Label>
            <Input id="mi-href" value={href} onChange={(e) => setHref(e.target.value)} placeholder="/consoles ou https://…" maxLength={300} />
          </div>
          {!isChild && (
            <div className="field">
              <Label htmlFor="mi-type">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as TypeOpt)}>
                <SelectTrigger id="mi-type" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Link simples</SelectItem>
                  <SelectItem value="flyout">Flyout (mega-menu com ícone + descrição)</SelectItem>
                  <SelectItem value="dropdown">Dropdown (lista de links)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {showIcon && (
            <>
              <div className="field">
                <Label htmlFor="mi-icon">Ícone (flyout)</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger id="mi-icon" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem ícone</SelectItem>
                    {ICON_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>{ICON_LABELS[k as IconKey]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="field">
                <Label htmlFor="mi-desc">Descrição (flyout)</Label>
                <Input id="mi-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} placeholder="Texto de apoio no mega-menu" />
              </div>
            </>
          )}
        </div>
        <div className="modal-actions">
          <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
          <Button type="button" size="sm" disabled={pending || label.trim().length < 1} onClick={save}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
