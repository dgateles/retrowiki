"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRuleAction, updateRuleAction } from "@/lib/actions/achievement-actions";

type Recipient = { key: "actor" | "target"; label: string };
type TriggerDef = { key: string; label: string; recipients: Recipient[] };
type Reward = { points: number; badge: string };
type Rewards = Record<string, Reward>;
type Opt = { value: string; label: string };

export function AchievementRuleForm({
  mode,
  ruleId,
  initial,
  triggers,
  badges,
}: {
  mode: "create" | "edit";
  ruleId?: number;
  initial: { name: string; trigger: string; milestone: number; enabled: boolean; sortOrder: number; rewards: Rewards };
  triggers: TriggerDef[];
  badges: Opt[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [trigger, setTrigger] = useState(initial.trigger);
  const [milestone, setMilestone] = useState(initial.milestone);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [sortOrder, setSortOrder] = useState(initial.sortOrder);
  const [rewards, setRewards] = useState<Rewards>(initial.rewards);
  const [pending, setPending] = useState(false);

  const def = triggers.find((t) => t.key === trigger) ?? triggers[0];

  function changeTrigger(next: string) {
    setTrigger(next);
    const d = triggers.find((t) => t.key === next);
    const fresh: Rewards = {};
    for (const r of d?.recipients ?? []) fresh[r.key] = rewards[r.key] ?? { points: 0, badge: "" };
    setRewards(fresh);
  }

  function setReward(key: string, patch: Partial<Reward>) {
    setRewards((prev) => {
      const cur = prev[key] ?? { points: 0, badge: "" };
      return { ...prev, [key]: { ...cur, ...patch } };
    });
  }

  async function save() {
    if (name.trim().length < 2) {
      toast.error("Dê um nome à regra.");
      return;
    }
    setPending(true);
    const body = JSON.stringify({ name, trigger, milestone, enabled, sortOrder, rewards });
    const res = mode === "create" ? await createRuleAction(body) : await updateRuleAction(ruleId!, body);
    setPending(false);
    if (res.ok) {
      toast.success(mode === "create" ? "Regra criada." : "Regra salva.");
      router.push("/admin/regras");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha.");
    }
  }

  return (
    <div className="rule-form">
      <section className="rule-form__section">
        <h2 className="rule-form__title">Detalhes</h2>
        <div className="field">
          <Label htmlFor="ar-name">Nome</Label>
          <Input id="ar-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </div>
        <label className="rule-form__check">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Ativada
        </label>
        <div className="field">
          <Label htmlFor="ar-order">Ordem</Label>
          <Input id="ar-order" type="number" min={0} value={String(sortOrder)} onChange={(e) => setSortOrder(Math.max(0, Math.floor(Number(e.target.value) || 0)))} className="w-24" />
        </div>
      </section>

      <section className="rule-form__section">
        <h2 className="rule-form__title">Quando</h2>
        <div className="field">
          <Label htmlFor="ar-trigger">Gatilho</Label>
          <select id="ar-trigger" className="rte__select" value={trigger} onChange={(e) => changeTrigger(e.target.value)}>
            {triggers.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <Label htmlFor="ar-milestone">Marco (0 = toda vez; N = só na N-ésima ação do usuário)</Label>
          <Input id="ar-milestone" type="number" min={0} value={String(milestone)} onChange={(e) => setMilestone(Math.max(0, Math.floor(Number(e.target.value) || 0)))} className="w-28" />
        </div>
      </section>

      <section className="rule-form__section">
        <h2 className="rule-form__title">Então</h2>
        {def.recipients.map((rec) => (
          <div key={rec.key} className="reward-row">
            <p className="reward-row__who">{rec.label}</p>
            <div className="reward-row__fields">
              <div className="field">
                <Label htmlFor={`ar-pts-${rec.key}`}>Pontos</Label>
                <Input id={`ar-pts-${rec.key}`} type="number" min={0} value={String(rewards[rec.key]?.points ?? 0)} onChange={(e) => setReward(rec.key, { points: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} className="w-24" />
              </div>
              <div className="field">
                <Label htmlFor={`ar-badge-${rec.key}`}>Badge</Label>
                <select id={`ar-badge-${rec.key}`} className="rte__select" value={rewards[rec.key]?.badge ?? ""} onChange={(e) => setReward(rec.key, { badge: e.target.value })}>
                  <option value="">(Nenhuma)</option>
                  {badges.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="rule-form__foot">
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
