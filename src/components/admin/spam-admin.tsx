"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useConfirm } from "@/components/admin/confirm-dialog";
import {
  saveSpamSettingsAction,
  createQuestionAction,
  updateQuestionAction,
  deleteQuestionAction,
  upsertGeoRuleAction,
  deleteGeoRuleAction,
} from "@/lib/actions/spam-actions";
import type { SpamSettings } from "@/lib/settings";
import type { SpamQuestion, GeoRule } from "@/lib/spam";

type Tab = "retroguard" | "qa" | "geo";

export function SpamAdmin({
  settings: initialSettings,
  questions,
  geoRules,
}: {
  settings: SpamSettings;
  questions: SpamQuestion[];
  geoRules: GeoRule[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>("retroguard");
  const [s, setS] = useState(initialSettings);
  const [savingS, setSavingS] = useState(false);
  const [qDialog, setQDialog] = useState<{ q: SpamQuestion | null } | null>(null);
  // Geo add
  const [cc, setCc] = useState("");
  const [geoAction, setGeoAction] = useState<"flag" | "block">("flag");

  async function saveSettings() {
    setSavingS(true);
    const res = await saveSpamSettingsAction(JSON.stringify(s));
    setSavingS(false);
    if (res.ok) toast.success("Configurações salvas."); else toast.error(res.error ?? "Falha.");
  }
  async function removeQuestion(id: number) {
    if (!(await confirm({ description: "Excluir esta pergunta?", confirmLabel: "Excluir", destructive: true }))) return;
    const res = await deleteQuestionAction(id);
    if (res.ok) { toast.success("Pergunta excluída."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function addGeo() {
    const res = await upsertGeoRuleAction(cc, geoAction);
    if (res.ok) { toast.success("Regra salva."); setCc(""); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function removeGeo(id: number) {
    const res = await deleteGeoRuleAction(id);
    if (res.ok) { toast.success("Regra removida."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "retroguard", label: "RetroGuard" },
    { key: "qa", label: "Pergunta & Resposta" },
    { key: "geo", label: "Geolocalização" },
  ];

  return (
    <div className="mt-6">
      <div className="perm-form__tabs" role="tablist" aria-label="Prevenção de spam">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={cn("perm-form__tab", tab === t.key && "perm-form__tab--active")} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "retroguard" && (
          <div className="rule-form">
            <section className="rule-form__section">
              <h2 className="rule-form__title">Captcha proprietário (RetroGuard)</h2>
              <div className="field">
                <Label htmlFor="sp-diff">Dificuldade do proof-of-work (bits, 8–24)</Label>
                <Input id="sp-diff" type="number" min={8} max={24} className="w-32" value={String(s.difficulty)} onChange={(e) => setS({ ...s, difficulty: Math.max(8, Math.min(24, Math.floor(Number(e.target.value) || 16))) })} />
                <p className="field__hint">Maior = mais custo para bots (e um pouco mais de espera). 16 ≈ imperceptível.</p>
              </div>
              <h2 className="rule-form__title mt-4">Ao marcar um membro como spammer</h2>
              <label className="rule-form__check"><input type="checkbox" checked={s.flagRestrict} onChange={(e) => setS({ ...s, flagRestrict: e.target.checked })} /> Suspender (impedir novos envios)</label>
              <label className="rule-form__check"><input type="checkbox" checked={s.flagHide} onChange={(e) => setS({ ...s, flagHide: e.target.checked })} /> Ocultar o conteúdo já enviado</label>
              <label className="rule-form__check"><input type="checkbox" checked={s.flagBan} onChange={(e) => setS({ ...s, flagBan: e.target.checked })} /> Banir o e-mail</label>
            </section>
            <div className="rule-form__foot">
              <Button type="button" size="sm" onClick={saveSettings} disabled={savingS}>{savingS ? "Salvando…" : "Salvar"}</Button>
            </div>
          </div>
        )}

        {tab === "qa" && (
          <div>
            <div className="pf-toolbar">
              <Button size="sm" onClick={() => setQDialog({ q: null })}><Plus className="size-4" aria-hidden="true" /> Nova pergunta</Button>
            </div>
            <p className="muted mt-2 text-xs">Se houver perguntas, uma é exibida no cadastro e a resposta é exigida.</p>
            {questions.length === 0 ? (
              <p className="muted mt-4">Nenhuma pergunta (desafio inativo).</p>
            ) : (
              <ul className="pf-groups mt-4">
                {questions.map((q) => (
                  <li key={q.id} className="pf-group">
                    <div className="pf-group__head">
                      <span className="min-w-0">
                        <span className="pf-group__name">{q.question}</span>
                        <span className="pf-field__meta block">{q.answers.length} resposta(s) aceita(s)</span>
                      </span>
                      <div className="pf-group__actions">
                        <button type="button" className="pf-icon" title="Editar" onClick={() => setQDialog({ q })}><Pencil className="size-4" aria-hidden="true" /></button>
                        <button type="button" className="pf-icon pf-icon--danger" title="Excluir" onClick={() => removeQuestion(q.id)}><X className="size-4" aria-hidden="true" /></button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "geo" && (
          <div>
            <p className="muted">Sob ataque de um país, sinalize (cria a conta suspensa) ou bloqueie o cadastro de lá. Código ISO de 2 letras (ex.: RU, CN).</p>
            <div className="pf-inline mt-4">
              <Input className="w-24" placeholder="RU" value={cc} maxLength={2} onChange={(e) => setCc(e.target.value.toUpperCase())} aria-label="Código do país" />
              <select className="rte__select w-44" value={geoAction} onChange={(e) => setGeoAction(e.target.value as "flag" | "block")}>
                <option value="flag">Sinalizar (suspender)</option>
                <option value="block">Bloquear cadastro</option>
              </select>
              <Button type="button" size="sm" onClick={addGeo}>Adicionar</Button>
            </div>
            {geoRules.length === 0 ? (
              <p className="muted mt-4">Nenhuma regra.</p>
            ) : (
              <ul className="pf-groups mt-4">
                {geoRules.map((g) => (
                  <li key={g.id} className="pf-group">
                    <div className="pf-group__head">
                      <span className="pf-group__name">{g.countryCode}</span>
                      <div className="pf-group__actions">
                        <span className="pf-field__meta mr-2">{g.action === "block" ? "Bloquear" : "Sinalizar"}</span>
                        <button type="button" className="pf-icon pf-icon--danger" title="Remover" onClick={() => removeGeo(g.id)}><X className="size-4" aria-hidden="true" /></button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {qDialog && <QuestionDialog question={qDialog.q} onClose={() => setQDialog(null)} onSaved={() => { setQDialog(null); router.refresh(); }} />}
    </div>
  );
}

function QuestionDialog({ question, onClose, onSaved }: { question: SpamQuestion | null; onClose: () => void; onSaved: () => void }) {
  const [q, setQ] = useState(question?.question ?? "");
  const [answers, setAnswers] = useState<string[]>(question?.answers.length ? question.answers : [""]);
  const [pending, setPending] = useState(false);

  function setAns(i: number, v: string) { setAnswers((p) => p.map((a, j) => (j === i ? v : a))); }
  function addAns() { setAnswers((p) => [...p, ""]); }
  function removeAns(i: number) { setAnswers((p) => p.filter((_, j) => j !== i)); }

  async function save() {
    const cleaned = answers.map((a) => a.trim()).filter(Boolean);
    if (q.trim().length < 1) { toast.error("Informe a pergunta."); return; }
    if (cleaned.length === 0) { toast.error("Informe ao menos uma resposta."); return; }
    setPending(true);
    const body = JSON.stringify({ question: q, answers: cleaned });
    const res = question ? await updateQuestionAction(question.id, body) : await createQuestionAction(body);
    setPending(false);
    if (res.ok) { toast.success(question ? "Pergunta salva." : "Pergunta criada."); onSaved(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>{question ? "Editar pergunta" : "Nova pergunta"}</DialogTitle>
        <div className="member-create">
          <div className="field"><Label htmlFor="q-q">Pergunta</Label><Input id="q-q" value={q} onChange={(e) => setQ(e.target.value)} maxLength={255} /></div>
          <div className="field">
            <Label>Respostas aceitas</Label>
            {answers.map((a, i) => (
              <div key={i} className="pf-inline mt-1">
                <Input value={a} onChange={(e) => setAns(i, e.target.value)} placeholder="Resposta" />
                {answers.length > 1 && <button type="button" className="pf-icon pf-icon--danger" onClick={() => removeAns(i)} title="Remover"><X className="size-4" aria-hidden="true" /></button>}
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={addAns}><Plus className="size-4" aria-hidden="true" /> Adicionar resposta</Button>
            <p className="field__hint">Considere variações e erros comuns (ex.: "azul", "Azul").</p>
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
