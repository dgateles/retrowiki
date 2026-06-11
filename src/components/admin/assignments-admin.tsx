"use client";

import { useState } from "react";
import { useConfirm } from "@/components/admin/confirm-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  saveAssignmentSettingsAction,
  createTeamAction,
  updateTeamAction,
  deleteTeamAction,
  closeAssignmentAction,
} from "@/lib/actions/assignment-actions";
import type { AssignmentRow, ModTeam } from "@/lib/assignments";
import type { AssignmentSettings } from "@/lib/settings";

type ModOpt = { id: number; name: string };
type Tab = "lista" | "equipes" | "config";

const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

export function AssignmentsAdmin({ assignments, teams, mods, settings: initial }: { assignments: AssignmentRow[]; teams: ModTeam[]; mods: ModOpt[]; settings: AssignmentSettings }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>("lista");
  const [s, setS] = useState(initial);
  const [savingS, setSavingS] = useState(false);
  const [teamDialog, setTeamDialog] = useState<{ t: ModTeam | null } | null>(null);
  const [busy, setBusy] = useState(false);

  async function close(id: number) {
    setBusy(true);
    const res = await closeAssignmentAction(id);
    setBusy(false);
    if (res.ok) { toast.success("Atribuição fechada."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function removeTeam(id: number, name: string) {
    if (!(await confirm({ description: `Excluir a equipe "${name}"?`, confirmLabel: "Excluir", destructive: true }))) return;
    const res = await deleteTeamAction(id);
    if (res.ok) { toast.success("Equipe excluída."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function saveSettings() {
    setSavingS(true);
    const res = await saveAssignmentSettingsAction(JSON.stringify(s));
    setSavingS(false);
    if (res.ok) toast.success("Configurações salvas."); else toast.error(res.error ?? "Falha.");
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "lista", label: `Atribuições${assignments.length ? ` (${assignments.length})` : ""}` },
    { key: "equipes", label: "Equipes" },
    { key: "config", label: "Configurações" },
  ];

  return (
    <div className="mt-6">
      <div className="perm-form__tabs" role="tablist" aria-label="Atribuições">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={cn("perm-form__tab", tab === t.key && "perm-form__tab--active")} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "lista" && (
          assignments.length === 0 ? (
            <p className="muted">Nenhuma atribuição aberta. Atribua um guia pela própria página dele (botão Atribuir, para moderadores).</p>
          ) : (
            <ul className="pf-groups">
              {assignments.map((a) => (
                <li key={a.id} className="pf-group">
                  <div className="report-row">
                    <div className="min-w-0">
                      <p className="report-row__title">{a.contentLink ? <Link href={a.contentLink} className="link-inline" target="_blank">{a.contentTitle}</Link> : a.contentTitle}</p>
                      <p className="pf-field__meta">Para {a.assigneeType === "team" ? "equipe" : "moderador"} {a.assigneeName} · {fmt(a.createdAt)}{a.note ? ` · "${a.note.slice(0, 60)}"` : ""}</p>
                    </div>
                    <div className="report-row__actions">
                      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => close(a.id)}><Check className="size-4" aria-hidden="true" /> Fechar</Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {tab === "equipes" && (
          <div>
            <div className="pf-toolbar"><Button size="sm" onClick={() => setTeamDialog({ t: null })}><Plus className="size-4" aria-hidden="true" /> Nova equipe</Button></div>
            {teams.length === 0 ? (
              <p className="muted mt-4">Nenhuma equipe.</p>
            ) : (
              <ul className="pf-groups mt-4">
                {teams.map((t) => (
                  <li key={t.id} className="pf-group">
                    <div className="pf-group__head">
                      <span className="min-w-0"><span className="pf-group__name">{t.name}</span><span className="pf-field__meta block">{t.memberCount} membro(s)</span></span>
                      <div className="pf-group__actions">
                        <button type="button" className="pf-icon" title="Editar" onClick={() => setTeamDialog({ t })}><Pencil className="size-4" aria-hidden="true" /></button>
                        <button type="button" className="pf-icon pf-icon--danger" title="Excluir" onClick={() => removeTeam(t.id, t.name)}><X className="size-4" aria-hidden="true" /></button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "config" && (
          <div className="rule-form">
            <section className="rule-form__section">
              <label className="rule-form__check"><input type="checkbox" checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} /> Atribuições de conteúdo ativas</label>
              <div className="field">
                <Label htmlFor="as-close">Fechar automaticamente após (dias sem atividade; 0 = nunca)</Label>
                <Input id="as-close" type="number" min={0} className="w-32" value={String(s.autoCloseDays)} onChange={(e) => setS({ ...s, autoCloseDays: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
              </div>
            </section>
            <div className="rule-form__foot"><Button type="button" size="sm" onClick={saveSettings} disabled={savingS}>{savingS ? "Salvando…" : "Salvar"}</Button></div>
          </div>
        )}
      </div>

      {teamDialog && <TeamDialog team={teamDialog.t} mods={mods} onClose={() => setTeamDialog(null)} onSaved={() => { setTeamDialog(null); router.refresh(); }} />}
    </div>
  );
}

function TeamDialog({ team, mods, onClose, onSaved }: { team: ModTeam | null; mods: ModOpt[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(team?.name ?? "");
  const [selected, setSelected] = useState<Set<number>>(() => new Set(team?.memberIds ?? []));
  const [pending, setPending] = useState(false);

  function toggle(id: number, on: boolean) {
    setSelected((prev) => { const next = new Set(prev); if (on) next.add(id); else next.delete(id); return next; });
  }
  async function save() {
    if (name.trim().length < 1) { toast.error("Informe o nome."); return; }
    setPending(true);
    const body = JSON.stringify({ name, memberIds: [...selected] });
    const res = team ? await updateTeamAction(team.id, body) : await createTeamAction(body);
    setPending(false);
    if (res.ok) { toast.success(team ? "Equipe salva." : "Equipe criada."); onSaved(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] overflow-y-auto">
        <DialogTitle>{team ? "Editar equipe" : "Nova equipe"}</DialogTitle>
        <div className="member-create">
          <div className="field"><Label htmlFor="tm-name">Nome</Label><Input id="tm-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} /></div>
          <div className="field">
            <Label>Membros (moderadores e admins)</Label>
            <div className="pff-options">
              {mods.length === 0 ? <p className="muted text-sm">Nenhum moderador disponível.</p> : mods.map((m) => (
                <label key={m.id} className="rule-form__check"><input type="checkbox" checked={selected.has(m.id)} onChange={(e) => toggle(m.id, e.target.checked)} /> {m.name}</label>
              ))}
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
