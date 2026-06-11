"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
            <Select value={String(v.groupId)} onValueChange={(val) => set("groupId", Number(val))}>
              <SelectTrigger id="pf-group" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{groups.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="field">
            <Label htmlFor="pf-type">Tipo</Label>
            <Select value={v.type} onValueChange={(val) => set("type", val as FieldType)}>
              <SelectTrigger id="pf-type" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {TYPES_WITH_OPTIONS.has(v.type) && (
            <div className="field">
              <Label htmlFor="pf-options">Opções (uma por linha)</Label>
              <Textarea id="pf-options" rows={4} value={v.optionsText} onChange={(e) => set("optionsText", e.target.value)} />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={v.required} onCheckedChange={(c) => set("required", c === true)} /> Obrigatório
          </label>
          <div className="field">
            <Label>Tamanho máximo</Label>
            <div className="pf-inline">
              <Input type="number" min={1} className="w-28" value={v.maxLength} disabled={v.unlimited} onChange={(e) => set("maxLength", e.target.value)} />
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={v.unlimited} onCheckedChange={(c) => set("unlimited", c === true)} /> Ilimitado
              </label>
            </div>
          </div>
          <div className="field">
            <Label htmlFor="pf-regex">Expressão regular (opcional)</Label>
            <Input id="pf-regex" value={v.regex} onChange={(e) => set("regex", e.target.value)} placeholder="/^[A-Z0-9]+$/i" maxLength={255} />
          </div>

          <h3 className="pf-form__legend">Permissões</h3>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={v.showOnRegister} onCheckedChange={(c) => set("showOnRegister", c === true)} /> Mostrar no cadastro
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={v.memberEditable} onCheckedChange={(c) => set("memberEditable", c === true)} /> O membro pode editar
          </label>
          <div className="field">
            <Label htmlFor="pf-vis">Mostrar no perfil do membro</Label>
            <Select value={v.visibility} onValueChange={(val) => set("visibility", val as Visibility)}>
              <SelectTrigger id="pf-vis" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{VISIBILITY.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={v.pii} onCheckedChange={(c) => set("pii", c === true)} /> Contém dado pessoal (entra na exportação)
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
