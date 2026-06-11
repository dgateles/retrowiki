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
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SettingGroup, SettingToggle } from "@/components/admin/setting-toggle";
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
              <SettingGroup>
                <SettingToggle label="Reputação e reações ativas" description="Liga o sistema de reações e pontos de reputação." checked={s.enabled} onCheckedChange={(c) => setField("enabled", c)} />
              </SettingGroup>

              <div className="field">
                <span className="text-sm font-medium leading-none">Excluir estes grupos (conteúdo não recebe reações)</span>
                <ToggleGroup type="multiple" variant="outline" spacing={2} value={s.excludeRoles} onValueChange={(vals) => setField("excludeRoles", vals)} className="mt-1 w-full flex-wrap justify-start">
                  {ROLES.map((r) => (
                    <ToggleGroupItem key={r.value} value={r.value} className="px-4 data-[state=on]:border-primary/50 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">{r.label}</ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <SettingGroup>
                <SettingToggle label="Membros podem reagir ao próprio conteúdo" checked={s.reactToOwn} onCheckedChange={(c) => setField("reactToOwn", c)} />
                <SettingToggle label="Mostrar a reputação total no perfil" checked={s.showOnProfile} onCheckedChange={(c) => setField("showOnProfile", c)} />
              </SettingGroup>

              <div className="field">
                <Label htmlFor="rep-hl">Destacar conteúdo com reputação ≥ (0 = nunca)</Label>
                <Input id="rep-hl" type="number" min={0} className="w-32" value={String(s.highlightThreshold)} onChange={(e) => setField("highlightThreshold", Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
              </div>

              <div className="field">
                <span className="text-sm font-medium leading-none">Exibição das reações</span>
                <RadioGroup value={s.reactionDisplay} onValueChange={(v) => setField("reactionDisplay", v as "individual" | "total")} className="mt-1 gap-2">
                  <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="individual" /> Mostrar reações individualmente</label>
                  <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="total" /> Mostrar valor total</label>
                </RadioGroup>
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
                      <label className="mr-2 flex items-center gap-2 text-sm"><Switch checked={r.enabled} onCheckedChange={(c) => toggleReaction(r.id, c)} /> Ativa</label>
                      <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" title="Editar" onClick={() => setReactionDialog({ r })}><Pencil className="size-4" aria-hidden="true" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Excluir" onClick={() => removeReaction(r.id, r.name)}><X className="size-4" aria-hidden="true" /></Button>
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
              <SettingGroup>
                <SettingToggle label="Leaderboard ativo" checked={s.leaderboardEnabled} onCheckedChange={(c) => setField("leaderboardEnabled", c)} />
              </SettingGroup>
              <div className="field">
                <span className="text-sm font-medium leading-none">Excluir estes grupos do leaderboard</span>
                <ToggleGroup type="multiple" variant="outline" spacing={2} value={s.leaderboardExcludeRoles} onValueChange={(vals) => setField("leaderboardExcludeRoles", vals)} className="mt-1 w-full flex-wrap justify-start">
                  {ROLES.map((r) => (
                    <ToggleGroupItem key={r.value} value={r.value} className="px-4 data-[state=on]:border-primary/50 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">{r.label}</ToggleGroupItem>
                  ))}
                </ToggleGroup>
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
                      <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" title="Editar" onClick={() => setLevelDialog({ l })}><Pencil className="size-4" aria-hidden="true" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Excluir" onClick={() => removeLevel(l.id, l.title)}><X className="size-4" aria-hidden="true" /></Button>
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
            <Select value={weight} onValueChange={setWeight}>
              <SelectTrigger id="rd-weight" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Positiva (+1)</SelectItem>
                <SelectItem value="0">Neutra</SelectItem>
                <SelectItem value="-1">Negativa (−1)</SelectItem>
              </SelectContent>
            </Select>
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
