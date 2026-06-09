"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRuleAction, updateRuleAction } from "@/lib/actions/promotion-actions";

type Criteria = {
  minReputation: number;
  minContent: number;
  minRank: number;
  badge: string;
  suspended: "any" | "yes" | "no";
  fromRoles: string[];
  joinedMinDays: number;
  activeWithinDays: number;
};

type Opt = { value: string; label: string };

export function PromotionRuleForm({
  mode,
  ruleId,
  initial,
  badges,
  rankTiers,
  roles,
}: {
  mode: "create" | "edit";
  ruleId?: number;
  initial: { name: string; enabled: boolean; sortOrder: number; targetRole: string; criteria: Criteria };
  badges: Opt[];
  rankTiers: { index: number; label: string }[];
  roles: Opt[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [sortOrder, setSortOrder] = useState(initial.sortOrder);
  const [targetRole, setTargetRole] = useState(initial.targetRole);
  const [c, setC] = useState<Criteria>(initial.criteria);
  const [pending, setPending] = useState(false);

  function setCrit<K extends keyof Criteria>(key: K, v: Criteria[K]) {
    setC((prev) => ({ ...prev, [key]: v }));
  }
  function toggleRole(role: string, on: boolean) {
    setC((prev) => ({ ...prev, fromRoles: on ? [...new Set([...prev.fromRoles, role])] : prev.fromRoles.filter((r) => r !== role) }));
  }

  async function save() {
    if (name.trim().length < 2) {
      toast.error("Dê um nome à regra.");
      return;
    }
    setPending(true);
    const body = JSON.stringify({ name, enabled, sortOrder, targetRole, criteria: c });
    const res = mode === "create" ? await createRuleAction(body) : await updateRuleAction(ruleId!, body);
    setPending(false);
    if (res.ok) {
      toast.success(mode === "create" ? "Regra criada." : "Regra salva.");
      router.push("/admin/promocoes");
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
          <Label htmlFor="rf-name">Nome</Label>
          <Input id="rf-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </div>
        <label className="rule-form__check">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Ativada
        </label>
        <div className="field">
          <Label htmlFor="rf-order">Ordem (a última regra que bate vence)</Label>
          <Input id="rf-order" type="number" min={0} value={String(sortOrder)} onChange={(e) => setSortOrder(Math.max(0, Math.floor(Number(e.target.value) || 0)))} className="w-28" />
        </div>
      </section>

      <section className="rule-form__section">
        <h2 className="rule-form__title">Critérios</h2>
        <div className="field">
          <Label htmlFor="rf-rep">Reputação mínima (0 = sem exigência)</Label>
          <Input id="rf-rep" type="number" min={0} value={String(c.minReputation)} onChange={(e) => setCrit("minReputation", Math.max(0, Math.floor(Number(e.target.value) || 0)))} className="w-32" />
        </div>
        <div className="field">
          <Label htmlFor="rf-content">Conteúdo mínimo (guias + comentários, 0 = sem exigência)</Label>
          <Input id="rf-content" type="number" min={0} value={String(c.minContent)} onChange={(e) => setCrit("minContent", Math.max(0, Math.floor(Number(e.target.value) || 0)))} className="w-32" />
        </div>
        <div className="field">
          <Label htmlFor="rf-rank">Rank mínimo</Label>
          <select id="rf-rank" className="rte__select" value={c.minRank} onChange={(e) => setCrit("minRank", Number(e.target.value))}>
            <option value={0}>Qualquer</option>
            {rankTiers.map((t) => (
              <option key={t.index} value={t.index}>{t.index}. {t.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <Label htmlFor="rf-badge">Badge exigida</Label>
          <select id="rf-badge" className="rte__select" value={c.badge} onChange={(e) => setCrit("badge", e.target.value)}>
            <option value="">Qualquer</option>
            {badges.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <Label htmlFor="rf-susp">Suspenso</Label>
          <select id="rf-susp" className="rte__select" value={c.suspended} onChange={(e) => setCrit("suspended", e.target.value as Criteria["suspended"])}>
            <option value="any">Qualquer</option>
            <option value="no">Não suspenso</option>
            <option value="yes">Suspenso</option>
          </select>
        </div>
        <div className="field">
          <Label htmlFor="rf-joined">Entrou há pelo menos (dias, 0 = qualquer)</Label>
          <Input id="rf-joined" type="number" min={0} value={String(c.joinedMinDays)} onChange={(e) => setCrit("joinedMinDays", Math.max(0, Math.floor(Number(e.target.value) || 0)))} className="w-32" />
        </div>
        <div className="field">
          <Label htmlFor="rf-active">Ativo nos últimos (dias, 0 = qualquer)</Label>
          <Input id="rf-active" type="number" min={0} value={String(c.activeWithinDays)} onChange={(e) => setCrit("activeWithinDays", Math.max(0, Math.floor(Number(e.target.value) || 0)))} className="w-32" />
        </div>
        <div className="field">
          <Label>Aplica-se aos papéis atuais</Label>
          <div className="rule-form__roles">
            {roles.map((r) => (
              <label key={r.value} className="rule-form__check">
                <input type="checkbox" checked={c.fromRoles.includes(r.value)} onChange={(e) => toggleRole(r.value, e.target.checked)} /> {r.label}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="rule-form__section">
        <h2 className="rule-form__title">Ação</h2>
        <div className="field">
          <Label htmlFor="rf-target">Mover para o papel</Label>
          <select id="rf-target" className="rte__select" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </section>

      <div className="rule-form__foot">
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
