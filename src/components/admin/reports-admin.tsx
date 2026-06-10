"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, X, Check, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  resolveReportAction,
  createReportTypeAction,
  updateReportTypeAction,
  deleteReportTypeAction,
  saveReportingSettingsAction,
} from "@/lib/actions/report-actions";
import type { ReportGroup, ReportType } from "@/lib/reports";
import type { ReportingSettings } from "@/lib/settings";

type Tab = "fila" | "tipos" | "config";

export function ReportsAdmin({
  queue,
  types,
  settings: initialSettings,
}: {
  queue: ReportGroup[];
  types: ReportType[];
  settings: ReportingSettings;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("fila");
  const [s, setS] = useState(initialSettings);
  const [savingS, setSavingS] = useState(false);
  const [typeDialog, setTypeDialog] = useState<{ t: ReportType | null } | null>(null);
  const [busy, setBusy] = useState(false);

  async function resolve(g: ReportGroup, decision: "completed" | "rejected") {
    setBusy(true);
    const res = await resolveReportAction(g.targetType, g.targetId, decision);
    setBusy(false);
    if (res.ok) { toast.success(decision === "completed" ? "Conteúdo removido." : "Denúncia arquivada."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function removeType(id: number, title: string) {
    if (!window.confirm(`Excluir o tipo "${title}"?`)) return;
    const res = await deleteReportTypeAction(id);
    if (res.ok) { toast.success("Tipo excluído."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function saveSettings() {
    setSavingS(true);
    const res = await saveReportingSettingsAction(JSON.stringify(s));
    setSavingS(false);
    if (res.ok) toast.success("Configurações salvas."); else toast.error(res.error ?? "Falha.");
  }
  function setCrit(key: string, value: number) {
    setS((prev) => ({ ...prev, trustedCriteria: { ...prev.trustedCriteria, [key]: value } }));
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "fila", label: `Fila${queue.length ? ` (${queue.length})` : ""}` },
    { key: "tipos", label: "Tipos de denúncia" },
    { key: "config", label: "Configurações" },
  ];

  return (
    <div className="mt-6">
      <div className="perm-form__tabs" role="tablist" aria-label="Denúncias">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={cn("perm-form__tab", tab === t.key && "perm-form__tab--active")} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "fila" && (
          queue.length === 0 ? (
            <p className="muted">Nenhuma denúncia em aberto.</p>
          ) : (
            <ul className="pf-groups">
              {queue.map((g) => (
                <li key={`${g.targetType}:${g.targetId}`} className="pf-group">
                  <div className="report-row">
                    <div className="min-w-0">
                      <p className="report-row__title">
                        {g.link ? <Link href={g.link} className="link-inline" target="_blank">{g.title}</Link> : g.title}
                      </p>
                      <p className="pf-field__meta">{g.reportCount} denúncia(s) · {g.reasons.join(", ")}{g.lastMessage ? ` · "${g.lastMessage.slice(0, 80)}"` : ""}</p>
                    </div>
                    <div className="report-row__actions">
                      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => resolve(g, "rejected")}><Ban className="size-4" aria-hidden="true" /> Arquivar</Button>
                      <Button type="button" size="sm" disabled={busy} onClick={() => resolve(g, "completed")}><Check className="size-4" aria-hidden="true" /> Remover conteúdo</Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {tab === "tipos" && (
          <div>
            <div className="pf-toolbar">
              <Button size="sm" onClick={() => setTypeDialog({ t: null })}><Plus className="size-4" aria-hidden="true" /> Novo tipo</Button>
            </div>
            <ul className="pf-groups mt-4">
              {types.map((t) => (
                <li key={t.id} className="pf-group">
                  <div className="pf-group__head">
                    <span className="pf-group__name">{t.title}</span>
                    <div className="pf-group__actions">
                      <button type="button" className="pf-icon" title="Editar" onClick={() => setTypeDialog({ t })}><Pencil className="size-4" aria-hidden="true" /></button>
                      <button type="button" className="pf-icon pf-icon--danger" title="Excluir" onClick={() => removeType(t.id, t.title)}><X className="size-4" aria-hidden="true" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "config" && (
          <div className="rule-form">
            <section className="rule-form__section">
              <label className="rule-form__check">
                <input type="checkbox" checked={s.messageMandatory} onChange={(e) => setS({ ...s, messageMandatory: e.target.checked })} /> Mensagem obrigatória ao denunciar
              </label>
              <label className="rule-form__check">
                <input type="checkbox" checked={s.autoModEnabled} onChange={(e) => setS({ ...s, autoModEnabled: e.target.checked })} /> Ativar moderação automática
              </label>
              <div className="field">
                <Label htmlFor="rs-th">Ocultar conteúdo após (denunciantes únicos)</Label>
                <Input id="rs-th" type="number" min={1} className="w-32" value={String(s.autoModThreshold)} onChange={(e) => setS({ ...s, autoModThreshold: Math.max(1, Math.floor(Number(e.target.value) || 1)) })} />
              </div>

              {s.autoModEnabled && (
                <div className="mt-4 border-t border-border/60 pt-4">
                  <label className="rule-form__check">
                    <input type="checkbox" checked={s.trustedAutoMod} onChange={(e) => setS({ ...s, trustedAutoMod: e.target.checked })} /> Ser mais rígido com autores de baixa confiança
                  </label>
                  {s.trustedAutoMod && (
                    <>
                      <p className="muted mt-2 text-xs">Autores que NÃO atingem o patamar abaixo têm o conteúdo ocultado com um limiar menor de denúncias.</p>
                      <div className="field">
                        <Label htmlFor="rs-uth">Limiar para autores de baixa confiança</Label>
                        <Input id="rs-uth" type="number" min={1} className="w-32" value={String(s.untrustedThreshold)} onChange={(e) => setS({ ...s, untrustedThreshold: Math.max(1, Math.floor(Number(e.target.value) || 1)) })} />
                      </div>
                      <p className="rule-form__title mt-2">Patamar de confiança do autor</p>
                      <div className="field">
                        <Label htmlFor="rs-rep">Reputação mínima</Label>
                        <Input id="rs-rep" type="number" min={0} className="w-32" value={String(Number(s.trustedCriteria.minReputation ?? 0))} onChange={(e) => setCrit("minReputation", Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
                      </div>
                      <div className="field">
                        <Label htmlFor="rs-cont">Conteúdo mínimo (guias + comentários)</Label>
                        <Input id="rs-cont" type="number" min={0} className="w-32" value={String(Number(s.trustedCriteria.minContent ?? 0))} onChange={(e) => setCrit("minContent", Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
                      </div>
                      <div className="field">
                        <Label htmlFor="rs-days">Conta com pelo menos (dias)</Label>
                        <Input id="rs-days" type="number" min={0} className="w-32" value={String(Number(s.trustedCriteria.joinedMinDays ?? 0))} onChange={(e) => setCrit("joinedMinDays", Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
            <div className="rule-form__foot">
              <Button type="button" size="sm" onClick={saveSettings} disabled={savingS}>{savingS ? "Salvando…" : "Salvar"}</Button>
            </div>
          </div>
        )}
      </div>

      {typeDialog && <TypeDialog type={typeDialog.t} onClose={() => setTypeDialog(null)} onSaved={() => { setTypeDialog(null); router.refresh(); }} />}
    </div>
  );
}

function TypeDialog({ type, onClose, onSaved }: { type: ReportType | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(type?.title ?? "");
  const [completed, setCompleted] = useState(type?.completedNotification ?? "");
  const [rejected, setRejected] = useState(type?.rejectedNotification ?? "");
  const [pending, setPending] = useState(false);

  async function save() {
    if (title.trim().length < 1) { toast.error("Informe o título."); return; }
    setPending(true);
    const body = JSON.stringify({ title, completedNotification: completed, rejectedNotification: rejected });
    const res = type ? await updateReportTypeAction(type.id, body) : await createReportTypeAction(body);
    setPending(false);
    if (res.ok) { toast.success(type ? "Tipo salvo." : "Tipo criado."); onSaved(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] overflow-y-auto">
        <DialogTitle>{type ? "Editar tipo" : "Novo tipo de denúncia"}</DialogTitle>
        <div className="member-create">
          <div className="field"><Label htmlFor="rt-title">Título</Label><Input id="rt-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} /></div>
          <div className="field">
            <Label htmlFor="rt-comp">E-mail ao concluir (opcional)</Label>
            <textarea id="rt-comp" className="q-textarea" rows={3} value={completed} onChange={(e) => setCompleted(e.target.value)} />
            <p className="field__hint">Tags: {"{name}"}, {"{reason}"}. Em branco = não envia.</p>
          </div>
          <div className="field">
            <Label htmlFor="rt-rej">E-mail ao arquivar (opcional)</Label>
            <textarea id="rt-rej" className="q-textarea" rows={3} value={rejected} onChange={(e) => setRejected(e.target.value)} />
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
