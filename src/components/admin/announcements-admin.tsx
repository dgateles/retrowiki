"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  createAnnouncementAction,
  toggleAnnouncementAction,
  deleteAnnouncementAction,
} from "@/lib/actions/announcement-actions";
import type { Announcement, Variant } from "@/lib/announcements";

const VARIANTS: { value: Variant; label: string }[] = [
  { value: "info", label: "Informação" },
  { value: "warning", label: "Aviso" },
  { value: "success", label: "Sucesso" },
];

export function AnnouncementsAdmin({ items }: { items: Announcement[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<Variant>("info");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [pending, setPending] = useState(false);

  async function create() {
    if (message.trim().length < 1) { toast.error("Informe a mensagem."); return; }
    setPending(true);
    const res = await createAnnouncementAction(JSON.stringify({ message, variant, linkUrl, linkLabel }));
    setPending(false);
    if (res.ok) { toast.success("Anúncio criado."); setMessage(""); setLinkUrl(""); setLinkLabel(""); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function toggle(id: number, active: boolean) {
    const res = await toggleAnnouncementAction(id, active);
    if (res.ok) router.refresh(); else toast.error(res.error ?? "Falha.");
  }
  async function remove(id: number) {
    if (!(await confirm({ description: "Excluir este anúncio?", confirmLabel: "Excluir", destructive: true }))) return;
    const res = await deleteAnnouncementAction(id);
    if (res.ok) { toast.success("Anúncio excluído."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <div className="mt-6">
      <section className="member-panel">
        <h2 className="member-panel__title">Novo anúncio</h2>
        <div className="rule-form mt-3">
          <section className="rule-form__section">
            <div className="field"><Label htmlFor="an-msg">Mensagem</Label><Input id="an-msg" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} /></div>
            <div className="field">
              <Label htmlFor="an-var">Estilo</Label>
              <Select value={variant} onValueChange={(v) => setVariant(v as Variant)}>
                <SelectTrigger id="an-var" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VARIANTS.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="pf-inline">
              <div className="field flex-1"><Label htmlFor="an-url">Link (opcional)</Label><Input id="an-url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/guias ou https://…" /></div>
              <div className="field flex-1"><Label htmlFor="an-label">Texto do link</Label><Input id="an-label" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} maxLength={80} placeholder="Saiba mais" /></div>
            </div>
          </section>
          <div className="rule-form__foot"><Button type="button" size="sm" onClick={create} disabled={pending}><Plus className="size-4" aria-hidden="true" /> {pending ? "Criando…" : "Criar anúncio"}</Button></div>
        </div>
      </section>

      <section className="member-panel mt-6">
        <h2 className="member-panel__title">Anúncios</h2>
        {items.length === 0 ? (
          <p className="muted mt-3">Nenhum anúncio.</p>
        ) : (
          <ul className="pf-groups mt-3">
            {items.map((a) => (
              <li key={a.id} className="pf-group">
                <div className="pf-group__head">
                  <span className="min-w-0">
                    <span className="pf-group__name">{a.message}</span>
                    <span className="pf-field__meta block">{VARIANTS.find((v) => v.value === a.variant)?.label}{a.linkUrl ? ` · ${a.linkUrl}` : ""}</span>
                  </span>
                  <div className="pf-group__actions items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground"><Switch checked={a.active} onCheckedChange={(c) => toggle(a.id, c)} /> Ativo</label>
                    <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Excluir" onClick={() => remove(a.id)}><X className="size-4" aria-hidden="true" /></Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
