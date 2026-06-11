"use client";

import { useState } from "react";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SettingGroup, SettingToggle } from "@/components/admin/setting-toggle";
import {
  saveWarningSettingsAction,
  createReasonAction,
  updateReasonAction,
  deleteReasonAction,
  createActionAction,
  deleteActionAction,
} from "@/lib/actions/warning-actions";
import type { WarningReason, WarningAction } from "@/lib/warnings";
import type { WarningSettings } from "@/lib/settings";

const ROLES = [
  { value: "member", label: "Membros" },
  { value: "contributor", label: "Colaboradores" },
  { value: "moderator", label: "Moderadores" },
  { value: "admin", label: "Administradores" },
];

type Tab = "reasons" | "actions" | "settings";

function hoursLabel(h: number): string {
  if (h === 0) return "—";
  if (h < 0) return "Indefinido";
  return `${h}h`;
}

export function WarningsAdmin({ reasons, actions, settings: initial }: { reasons: WarningReason[]; actions: WarningAction[]; settings: WarningSettings }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>("reasons");
  const [s, setS] = useState(initial);
  const [savingS, setSavingS] = useState(false);
  const [reasonDialog, setReasonDialog] = useState<{ r: WarningReason | null } | null>(null);
  const [actionOpen, setActionOpen] = useState(false);

  async function saveSettings() {
    setSavingS(true);
    const res = await saveWarningSettingsAction(JSON.stringify(s));
    setSavingS(false);
    if (res.ok) toast.success("Configurações salvas."); else toast.error(res.error ?? "Falha.");
  }
  async function removeReason(id: number, name: string) {
    if (!(await confirm({ description: `Excluir o motivo "${name}"?`, confirmLabel: "Excluir", destructive: true }))) return;
    const res = await deleteReasonAction(id);
    if (res.ok) { toast.success("Motivo excluído."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function removeAction(id: number) {
    if (!(await confirm({ description: "Excluir esta ação?", confirmLabel: "Excluir", destructive: true }))) return;
    const res = await deleteActionAction(id);
    if (res.ok) { toast.success("Ação excluída."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "reasons", label: "Motivos" },
    { key: "actions", label: "Ações" },
    { key: "settings", label: "Configurações" },
  ];

  return (
    <div className="mt-6">
      <div className="perm-form__tabs" role="tablist" aria-label="Advertências">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={cn("perm-form__tab", tab === t.key && "perm-form__tab--active")} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "reasons" && (
          <div>
            <div className="pf-toolbar"><Button size="sm" onClick={() => setReasonDialog({ r: null })}><Plus className="size-4" aria-hidden="true" /> Novo motivo</Button></div>
            <ul className="pf-groups mt-4">
              {reasons.map((r) => (
                <li key={r.id} className="pf-group">
                  <div className="pf-group__head">
                    <span className="min-w-0">
                      <span className="pf-group__name">{r.name}</span>
                      <span className="pf-field__meta block">{r.points} ponto(s){r.removeAfterHours ? ` · expira em ${r.removeAfterHours}h` : ""}{r.deductReputation ? ` · −${r.deductReputation} reputação` : ""}</span>
                    </span>
                    <div className="pf-group__actions">
                      <button type="button" className="pf-icon" title="Editar" onClick={() => setReasonDialog({ r })}><Pencil className="size-4" aria-hidden="true" /></button>
                      <button type="button" className="pf-icon pf-icon--danger" title="Excluir" onClick={() => removeReason(r.id, r.name)}><X className="size-4" aria-hidden="true" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "actions" && (
          <div>
            <div className="pf-toolbar"><Button size="sm" onClick={() => setActionOpen(true)}><Plus className="size-4" aria-hidden="true" /> Nova ação</Button></div>
            <p className="muted mt-2 text-xs">Penalidades aplicadas quando o membro atinge o número de pontos ativos.</p>
            {actions.length === 0 ? (
              <p className="muted mt-4">Nenhuma ação.</p>
            ) : (
              <div className="bantable mt-4">
                <div className="bantable__head" style={{ gridTemplateColumns: "auto 1fr 1fr auto" }}>
                  <span>Pontos</span><span>Restringir postagem</span><span>Banir</span><span className="sr-only">Ações</span>
                </div>
                {actions.map((a) => (
                  <div key={a.id} className="bantable__row" style={{ gridTemplateColumns: "auto 1fr 1fr auto" }}>
                    <span className="font-medium">{a.points}</span>
                    <span className="muted">{hoursLabel(a.restrictHours)}</span>
                    <span className="muted">{hoursLabel(a.banHours)}</span>
                    <button type="button" className="pf-icon pf-icon--danger" title="Excluir" onClick={() => removeAction(a.id)}><X className="size-4" aria-hidden="true" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="rule-form">
            <section className="rule-form__section">
              <SettingGroup>
                <SettingToggle label="Sistema de advertências ativo" checked={s.enabled} onCheckedChange={(c) => setS({ ...s, enabled: c })} />
              </SettingGroup>
              <div className="field">
                <span className="text-sm font-medium leading-none">Grupos que não podem ser advertidos</span>
                <ToggleGroup type="multiple" variant="outline" spacing={2} value={s.cannotWarnRoles} onValueChange={(vals) => setS({ ...s, cannotWarnRoles: vals })} className="mt-1 w-full flex-wrap justify-start">
                  {ROLES.map((r) => (
                    <ToggleGroupItem key={r.value} value={r.value} className="px-4 data-[state=on]:border-primary/50 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">{r.label}</ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <SettingGroup>
                <SettingToggle label="Membros podem ver os próprios pontos e motivos" checked={s.membersCanSee} onCheckedChange={(c) => setS({ ...s, membersCanSee: c })} />
                <SettingToggle label="Exigir confirmação da advertência antes de postar de novo" checked={s.mustAcknowledge} onCheckedChange={(c) => setS({ ...s, mustAcknowledge: c })} />
              </SettingGroup>
            </section>
            <div className="rule-form__foot"><Button type="button" size="sm" onClick={saveSettings} disabled={savingS}>{savingS ? "Salvando…" : "Salvar"}</Button></div>
          </div>
        )}
      </div>

      {reasonDialog && <ReasonDialog reason={reasonDialog.r} onClose={() => setReasonDialog(null)} onSaved={() => { setReasonDialog(null); router.refresh(); }} />}
      {actionOpen && <ActionDialog onClose={() => setActionOpen(false)} onSaved={() => { setActionOpen(false); router.refresh(); }} />}
    </div>
  );
}

function ReasonDialog({ reason, onClose, onSaved }: { reason: WarningReason | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(reason?.name ?? "");
  const [points, setPoints] = useState(String(reason?.points ?? 1));
  const [remove, setRemove] = useState(String(reason?.removeAfterHours ?? ""));
  const [deduct, setDeduct] = useState(String(reason?.deductReputation ?? 0));
  const [note, setNote] = useState(reason?.defaultNote ?? "");
  const [pending, setPending] = useState(false);

  async function save() {
    if (name.trim().length < 1) { toast.error("Informe o nome."); return; }
    setPending(true);
    const body = JSON.stringify({ name, points: Number(points), removeAfterHours: Number(remove) || 0, deductReputation: Number(deduct) || 0, defaultNote: note });
    const res = reason ? await updateReasonAction(reason.id, body) : await createReasonAction(body);
    setPending(false);
    if (res.ok) { toast.success(reason ? "Motivo salvo." : "Motivo criado."); onSaved(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] overflow-y-auto">
        <DialogTitle>{reason ? "Editar motivo" : "Novo motivo"}</DialogTitle>
        <div className="member-create">
          <div className="field"><Label htmlFor="wr-name">Nome</Label><Input id="wr-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} /></div>
          <div className="field"><Label htmlFor="wr-points">Pontos de advertência</Label><Input id="wr-points" type="number" min={0} className="w-32" value={points} onChange={(e) => setPoints(e.target.value)} /></div>
          <div className="field"><Label htmlFor="wr-remove">Remover pontos após (horas, vazio = nunca)</Label><Input id="wr-remove" type="number" min={0} className="w-40" value={remove} onChange={(e) => setRemove(e.target.value)} /></div>
          <div className="field"><Label htmlFor="wr-deduct">Deduzir reputação</Label><Input id="wr-deduct" type="number" min={0} className="w-32" value={deduct} onChange={(e) => setDeduct(e.target.value)} /></div>
          <div className="field"><Label htmlFor="wr-note">Nota padrão para o membro</Label><textarea id="wr-note" className="q-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></div>
        </div>
        <div className="modal-actions">
          <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
          <Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActionDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [points, setPoints] = useState("0");
  const [restrict, setRestrict] = useState("0");
  const [restrictInd, setRestrictInd] = useState(false);
  const [ban, setBan] = useState("0");
  const [banInd, setBanInd] = useState(false);
  const [pending, setPending] = useState(false);

  async function save() {
    if (Number(points) <= 0) { toast.error("Informe os pontos (> 0)."); return; }
    setPending(true);
    const body = JSON.stringify({
      points: Number(points),
      restrictHours: restrictInd ? -1 : Number(restrict) || 0,
      banHours: banInd ? -1 : Number(ban) || 0,
      moderateHours: 0,
    });
    const res = await createActionAction(body);
    setPending(false);
    if (res.ok) { toast.success("Ação criada."); onSaved(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Nova ação</DialogTitle>
        <div className="member-create">
          <div className="field"><Label htmlFor="wa-points">Ao atingir (pontos ativos)</Label><Input id="wa-points" type="number" min={1} className="w-32" value={points} onChange={(e) => setPoints(e.target.value)} /></div>
          <div className="field">
            <Label htmlFor="wa-restrict">Restringir postagem por (horas)</Label>
            <div className="pf-inline">
              <Input id="wa-restrict" type="number" min={0} className="w-28" value={restrict} disabled={restrictInd} onChange={(e) => setRestrict(e.target.value)} />
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={restrictInd} onCheckedChange={(c) => setRestrictInd(c === true)} /> Indefinido</label>
            </div>
          </div>
          <div className="field">
            <Label htmlFor="wa-ban">Banir por (horas)</Label>
            <div className="pf-inline">
              <Input id="wa-ban" type="number" min={0} className="w-28" value={ban} disabled={banInd} onChange={(e) => setBan(e.target.value)} />
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={banInd} onCheckedChange={(c) => setBanInd(c === true)} /> Indefinido</label>
            </div>
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
