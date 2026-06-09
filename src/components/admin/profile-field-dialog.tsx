"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { createFieldAction, updateFieldAction } from "@/lib/actions/profile-field-actions";
import { FIELD_TYPES, TYPES_WITH_OPTIONS, VISIBILITY, type FieldType, type Visibility } from "@/lib/profile-field-types";
import type { ProfileField } from "@/lib/admin/profile-fields";

type GroupOpt = { id: number; name: string };

type FormState = {
  name: string;
  description: string;
  groupId: number;
  type: FieldType;
  optionsText: string;
  required: boolean;
  unlimited: boolean;
  maxLength: string;
  regex: string;
  showOnRegister: boolean;
  memberEditable: boolean;
  visibility: Visibility;
  pii: boolean;
};

function initialState(groups: GroupOpt[], field: ProfileField | null, defaultGroupId: number): FormState {
  if (field) {
    return {
      name: field.name,
      description: field.description,
      groupId: field.groupId,
      type: field.type,
      optionsText: field.options.join("\n"),
      required: field.required,
      unlimited: field.maxLength === null,
      maxLength: field.maxLength ? String(field.maxLength) : "",
      regex: field.regex ?? "",
      showOnRegister: field.showOnRegister,
      memberEditable: field.memberEditable,
      visibility: field.visibility,
      pii: field.pii,
    };
  }
  return {
    name: "",
    description: "",
    groupId: defaultGroupId || groups[0]?.id || 0,
    type: "text",
    optionsText: "",
    required: false,
    unlimited: true,
    maxLength: "",
    regex: "",
    showOnRegister: false,
    memberEditable: true,
    visibility: "all",
    pii: false,
  };
}

export function ProfileFieldDialog({
  open,
  onOpenChange,
  groups,
  field,
  defaultGroupId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  groups: GroupOpt[];
  field: ProfileField | null;
  defaultGroupId: number;
}) {
  const router = useRouter();
  const [v, setV] = useState<FormState>(() => initialState(groups, field, defaultGroupId));
  const [pending, setPending] = useState(false);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setV((prev) => ({ ...prev, [key]: val }));
  }

  async function save() {
    if (v.name.trim().length < 1) {
      toast.error("Dê um nome ao campo.");
      return;
    }
    if (TYPES_WITH_OPTIONS.has(v.type) && v.optionsText.trim().length === 0) {
      toast.error("Adicione ao menos uma opção.");
      return;
    }
    setPending(true);
    const body = JSON.stringify({
      name: v.name,
      description: v.description,
      groupId: v.groupId,
      type: v.type,
      options: TYPES_WITH_OPTIONS.has(v.type) ? v.optionsText.split("\n").map((s) => s.trim()).filter(Boolean) : [],
      required: v.required,
      maxLength: v.unlimited ? 0 : Number(v.maxLength) || 0,
      regex: v.regex,
      showOnRegister: v.showOnRegister,
      memberEditable: v.memberEditable,
      visibility: v.visibility,
      pii: v.pii,
    });
    const res = field ? await updateFieldAction(field.id, body) : await createFieldAction(body);
    setPending(false);
    if (res.ok) {
      toast.success(field ? "Campo salvo." : "Campo criado.");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] overflow-y-auto">
        <DialogTitle>{field ? "Editar campo" : "Novo campo"}</DialogTitle>

        <div className="pf-form">
          <h3 className="pf-form__legend">Configurações do campo</h3>
          <div className="field">
            <Label htmlFor="pf-name">Nome</Label>
            <Input id="pf-name" value={v.name} onChange={(e) => set("name", e.target.value)} maxLength={120} />
          </div>
          <div className="field">
            <Label htmlFor="pf-desc">Descrição</Label>
            <Input id="pf-desc" value={v.description} onChange={(e) => set("description", e.target.value)} maxLength={300} />
          </div>
          <div className="field">
            <Label htmlFor="pf-group">Grupo</Label>
            <select id="pf-group" className="rte__select" value={v.groupId} onChange={(e) => set("groupId", Number(e.target.value))}>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <Label htmlFor="pf-type">Tipo</Label>
            <select id="pf-type" className="rte__select" value={v.type} onChange={(e) => set("type", e.target.value as FieldType)}>
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {TYPES_WITH_OPTIONS.has(v.type) && (
            <div className="field">
              <Label htmlFor="pf-options">Opções (uma por linha)</Label>
              <textarea id="pf-options" className="q-textarea" rows={4} value={v.optionsText} onChange={(e) => set("optionsText", e.target.value)} />
            </div>
          )}
          <label className="rule-form__check">
            <input type="checkbox" checked={v.required} onChange={(e) => set("required", e.target.checked)} /> Obrigatório
          </label>
          <div className="field">
            <Label>Tamanho máximo</Label>
            <div className="pf-inline">
              <Input type="number" min={1} className="w-28" value={v.maxLength} disabled={v.unlimited} onChange={(e) => set("maxLength", e.target.value)} />
              <label className="rule-form__check">
                <input type="checkbox" checked={v.unlimited} onChange={(e) => set("unlimited", e.target.checked)} /> Ilimitado
              </label>
            </div>
          </div>
          <div className="field">
            <Label htmlFor="pf-regex">Expressão regular (opcional)</Label>
            <Input id="pf-regex" value={v.regex} onChange={(e) => set("regex", e.target.value)} placeholder="/^[A-Z0-9]+$/i" maxLength={255} />
          </div>

          <h3 className="pf-form__legend">Permissões</h3>
          <label className="rule-form__check">
            <input type="checkbox" checked={v.showOnRegister} onChange={(e) => set("showOnRegister", e.target.checked)} /> Mostrar no cadastro
          </label>
          <label className="rule-form__check">
            <input type="checkbox" checked={v.memberEditable} onChange={(e) => set("memberEditable", e.target.checked)} /> O membro pode editar
          </label>
          <div className="field">
            <Label htmlFor="pf-vis">Mostrar no perfil do membro</Label>
            <select id="pf-vis" className="rte__select" value={v.visibility} onChange={(e) => set("visibility", e.target.value as Visibility)}>
              {VISIBILITY.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <label className="rule-form__check">
            <input type="checkbox" checked={v.pii} onChange={(e) => set("pii", e.target.checked)} /> Contém dado pessoal (entra na exportação)
          </label>
        </div>

        <div className="modal-actions">
          <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
          <Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
