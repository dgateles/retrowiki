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
  saveReputationSettingsAction,
  createReactionAction,
  updateReactionAction,
  deleteReactionAction,
  setReactionEnabledAction,
  createLevelAction,
  updateLevelAction,
  deleteLevelAction,
} from "@/lib/actions/reputation-actions";
import type { ReputationSettings } from "@/lib/settings";
import type { Reaction } from "@/lib/reactions";
import type { RepLevel } from "@/lib/reputation-levels";

const ROLES: { value: string; label: string }[] = [
  { value: "member", label: "Membros" },
  { value: "contributor", label: "Colaboradores" },
  { value: "moderator", label: "Moderadores" },
  { value: "admin", label: "Administradores" },
];

const WEIGHT_LABEL: Record<number, string> = { 1: "Positiva (+1)", 0: "Neutra", [-1]: "Negativa (−1)" };

type Tab = "config" | "reacoes" | "leaderboard" | "niveis";

export function ReputationTabs({
  settings: initialSettings,
  reactions: initialReactions,
  levels: initialLevels,
}: {
  settings: ReputationSettings;
  reactions: Reaction[];
  levels: RepLevel[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>("config");
  const [s, setS] = useState<ReputationSettings>(initialSettings);
  const [savingS, setSavingS] = useState(false);
  const [reactionDialog, setReactionDialog] = useState<{ r: Reaction | null } | null>(null);
  const [levelDialog, setLevelDialog] = useState<{ l: RepLevel | null } | null>(null);

  function setField<K extends keyof ReputationSettings>(key: K, val: ReputationSettings[K]) {
    setS((prev) => ({ ...prev, [key]: val }));
  }
  function toggleRole(key: "excludeRoles" | "leaderboardExcludeRoles", role: string, on: boolean) {
    setS((prev) => ({ ...prev, [key]: on ? [...new Set([...prev[key], role])] : prev[key].filter((r) => r !== role) }));
  }

  async function saveSettings() {
    setSavingS(true);
    const res = await saveReputationSettingsAction(JSON.stringify(s));
    setSavingS(false);
    if (res.ok) toast.success("Configurações salvas."); else toast.error(res.error ?? "Falha.");
  }

  async function removeReaction(id: number, name: string) {
    if (!(await confirm({ description: `Excluir a reação "${name}"?`, confirmLabel: "Excluir", destructive: true }))) return;
    const res = await deleteReactionAction(id);
    if (res.ok) { toast.success("Reação excluída."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function toggleReaction(id: number, enabled: boolean) {
    const res = await setReactionEnabledAction(id, enabled);
    if (res.ok) router.refresh(); else toast.error(res.error ?? "Falha.");
  }
  async function removeLevel(id: number, title: string) {
    if (!(await confirm({ description: `Excluir o nível "${title}"?`, confirmLabel: "Excluir", destructive: true }))) return;
    const res = await deleteLevelAction(id);
    if (res.ok) { toast.success("Nível excluído."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "config", label: "Configurações" },
    { key: "reacoes", label: "Reações" },
    { key: "leaderboard", label: "Leaderboard" },
    { key: "niveis", label: "Níveis de reputação" },
  ];

  return (
    <div className="mt-6">
      <div className="perm-form__tabs" role="tablist" aria-label="Reputação">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={cn("perm-form__tab", tab === t.key && "perm-form__tab--active")} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "config" && (
          <div className="rule-form">
            <section className="rule-form__section">
              <label className="rule-form__check">
                <input type="checkbox" checked={s.enabled} onChange={(e) => setField("enabled", e.target.checked)} /> Reputação e reações ativas
              </label>
              <div className="field">
                <Label>Excluir estes grupos (conteúdo não recebe reações)</Label>
                <div className="rule-form__roles">
                  {ROLES.map((r) => (
                    <label key={r.value} className="rule-form__check">
                      <input type="checkbox" checked={s.excludeRoles.includes(r.value)} onChange={(e) => toggleRole("excludeRoles", r.value, e.target.checked)} /> {r.label}
                    </label>
                  ))}
                </div>
              </div>
              <label className="rule-form__check">
                <input type="checkbox" checked={s.reactToOwn} onChange={(e) => setField("reactToOwn", e.target.checked)} /> Membros podem reagir ao próprio conteúdo
              </label>
              <label className="rule-form__check">
                <input type="checkbox" checked={s.showOnProfile} onChange={(e) => setField("showOnProfile", e.target.checked)} /> Mostrar a reputação total no perfil
              </label>
              <div className="field">
                <Label htmlFor="rep-hl">Destacar conteúdo com reputação ≥ (0 = nunca)</Label>
                <Input id="rep-hl" type="number" min={0} className="w-32" value={String(s.highlightThreshold)} onChange={(e) => setField("highlightThreshold", Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
              </div>
              <div className="field">
                <Label>Exibição das reações</Label>
                <div className="pff-options">
                  <label className="rule-form__check"><input type="radio" name="rep-disp" checked={s.reactionDisplay === "individual"} onChange={() => setField("reactionDisplay", "individual")} /> Mostrar reações individualmente</label>
                  <label className="rule-form__check"><input type="radio" name="rep-disp" checked={s.reactionDisplay === "total"} onChange={() => setField("reactionDisplay", "total")} /> Mostrar valor total</label>
                </div>
              </div>
            </section>
            <div className="rule-form__foot">
              <Button type="button" size="sm" onClick={saveSettings} disabled={savingS}>{savingS ? "Salvando…" : "Salvar"}</Button>
            </div>
          </div>
        )}

        {tab === "reacoes" && (
          <div>
            <div className="pf-toolbar">
              <Button size="sm" onClick={() => setReactionDialog({ r: null })}><Plus className="size-4" aria-hidden="true" /> Nova reação</Button>
            </div>
            <ul className="pf-groups mt-4">
              {initialReactions.map((r) => (
                <li key={r.id} className="pf-group">
                  <div className="pf-group__head">
                    <span className="pf-group__toggle">
                      <span className="reaction__emoji" aria-hidden="true">{r.emoji}</span>
                      <span className="pf-group__name">{r.name}</span>
                      <span className="pf-field__meta">{WEIGHT_LABEL[r.weight]}</span>
                    </span>
                    <div className="pf-group__actions">
                      <label className="rule-form__check mr-2"><input type="checkbox" checked={r.enabled} onChange={(e) => toggleReaction(r.id, e.target.checked)} /> Ativa</label>
                      <button type="button" className="pf-icon" title="Editar" onClick={() => setReactionDialog({ r })}><Pencil className="size-4" aria-hidden="true" /></button>
                      <button type="button" className="pf-icon pf-icon--danger" title="Excluir" onClick={() => removeReaction(r.id, r.name)}><X className="size-4" aria-hidden="true" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "leaderboard" && (
          <div className="rule-form">
            <section className="rule-form__section">
              <label className="rule-form__check">
                <input type="checkbox" checked={s.leaderboardEnabled} onChange={(e) => setField("leaderboardEnabled", e.target.checked)} /> Leaderboard ativo
              </label>
              <div className="field">
                <Label>Excluir estes grupos do leaderboard</Label>
                <div className="rule-form__roles">
                  {ROLES.map((r) => (
                    <label key={r.value} className="rule-form__check">
                      <input type="checkbox" checked={s.leaderboardExcludeRoles.includes(r.value)} onChange={(e) => toggleRole("leaderboardExcludeRoles", r.value, e.target.checked)} /> {r.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="field">
                <Label htmlFor="lb-tz">Fuso horário do leaderboard</Label>
                <Input id="lb-tz" className="max-w-xs" value={s.leaderboardTimezone} onChange={(e) => setField("leaderboardTimezone", e.target.value)} placeholder="America/Sao_Paulo" />
              </div>
            </section>
            <div className="rule-form__foot">
              <Button type="button" size="sm" onClick={saveSettings} disabled={savingS}>{savingS ? "Salvando…" : "Salvar"}</Button>
            </div>
          </div>
        )}

        {tab === "niveis" && (
          <div>
            <div className="pf-toolbar">
              <Button size="sm" onClick={() => setLevelDialog({ l: null })}><Plus className="size-4" aria-hidden="true" /> Novo nível</Button>
            </div>
            <ul className="pf-groups mt-4">
              {initialLevels.map((l) => (
                <li key={l.id} className="pf-group">
                  <div className="pf-group__head">
                    <span className="pf-group__toggle">
                      <span className="pf-group__name">{l.title}</span>
                      <span className="pf-field__meta">a partir de {l.points} pts</span>
                    </span>
                    <div className="pf-group__actions">
                      <button type="button" className="pf-icon" title="Editar" onClick={() => setLevelDialog({ l })}><Pencil className="size-4" aria-hidden="true" /></button>
                      <button type="button" className="pf-icon pf-icon--danger" title="Excluir" onClick={() => removeLevel(l.id, l.title)}><X className="size-4" aria-hidden="true" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {reactionDialog && <ReactionDialog reaction={reactionDialog.r} onClose={() => setReactionDialog(null)} onSaved={() => { setReactionDialog(null); router.refresh(); }} />}
      {levelDialog && <LevelDialog level={levelDialog.l} onClose={() => setLevelDialog(null)} onSaved={() => { setLevelDialog(null); router.refresh(); }} />}
    </div>
  );
}

function ReactionDialog({ reaction, onClose, onSaved }: { reaction: Reaction | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(reaction?.name ?? "");
  const [emoji, setEmoji] = useState(reaction?.emoji ?? "👍");
  const [weight, setWeight] = useState(String(reaction?.weight ?? 1));
  const [pending, setPending] = useState(false);

  async function save() {
    if (name.trim().length < 1) { toast.error("Informe o nome."); return; }
    setPending(true);
    const body = JSON.stringify({ name, emoji, weight: Number(weight), enabled: reaction?.enabled ?? true });
    const res = reaction ? await updateReactionAction(reaction.id, body) : await createReactionAction(body);
    setPending(false);
    if (res.ok) { toast.success(reaction ? "Reação salva." : "Reação criada."); onSaved(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>{reaction ? "Editar reação" : "Nova reação"}</DialogTitle>
        <div className="member-create">
          <div className="field"><Label htmlFor="rd-name">Nome</Label><Input id="rd-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></div>
          <div className="field"><Label htmlFor="rd-emoji">Emoji</Label><Input id="rd-emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={16} className="w-24 text-xl" /></div>
          <div className="field">
            <Label htmlFor="rd-weight">Peso (reputação)</Label>
            <select id="rd-weight" className="rte__select" value={weight} onChange={(e) => setWeight(e.target.value)}>
              <option value="1">Positiva (+1)</option>
              <option value="0">Neutra</option>
              <option value="-1">Negativa (−1)</option>
            </select>
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

function LevelDialog({ level, onClose, onSaved }: { level: RepLevel | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(level?.title ?? "");
  const [points, setPoints] = useState(String(level?.points ?? 0));
  const [pending, setPending] = useState(false);

  async function save() {
    if (title.trim().length < 1) { toast.error("Informe o título."); return; }
    setPending(true);
    const body = JSON.stringify({ title, points: Number(points), badge: level?.badge ?? "" });
    const res = level ? await updateLevelAction(level.id, body) : await createLevelAction(body);
    setPending(false);
    if (res.ok) { toast.success(level ? "Nível salvo." : "Nível criado."); onSaved(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>{level ? "Editar nível" : "Novo nível"}</DialogTitle>
        <div className="member-create">
          <div className="field"><Label htmlFor="ld-title">Título</Label><Input id="ld-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} /></div>
          <div className="field"><Label htmlFor="ld-points">Pontos (limiar, a partir de)</Label><Input id="ld-points" type="number" value={points} onChange={(e) => setPoints(e.target.value)} className="w-32" /></div>
        </div>
        <div className="modal-actions">
          <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
          <Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
