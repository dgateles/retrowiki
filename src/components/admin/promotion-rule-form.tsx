"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SettingGroup, SettingToggle } from "@/components/admin/setting-toggle";
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
        <SettingGroup>
          <SettingToggle label="Ativada" checked={enabled} onCheckedChange={setEnabled} />
        </SettingGroup>
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
          <Select value={String(c.minRank)} onValueChange={(val) => setCrit("minRank", Number(val))}>
            <SelectTrigger id="rf-rank" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Qualquer</SelectItem>
              {rankTiers.map((t) => <SelectItem key={t.index} value={String(t.index)}>{t.index}. {t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="field">
          <Label htmlFor="rf-badge">Badge exigida</Label>
          <Select value={c.badge || "any"} onValueChange={(val) => setCrit("badge", val === "any" ? "" : val)}>
            <SelectTrigger id="rf-badge" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Qualquer</SelectItem>
              {badges.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="field">
          <Label htmlFor="rf-susp">Suspenso</Label>
          <Select value={c.suspended} onValueChange={(val) => setCrit("suspended", val as Criteria["suspended"])}>
            <SelectTrigger id="rf-susp" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Qualquer</SelectItem>
              <SelectItem value="no">Não suspenso</SelectItem>
              <SelectItem value="yes">Suspenso</SelectItem>
            </SelectContent>
          </Select>
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
          <span className="text-sm font-medium leading-none">Aplica-se aos papéis atuais</span>
          <ToggleGroup type="multiple" variant="outline" spacing={2} value={c.fromRoles} onValueChange={(vals) => setCrit("fromRoles", vals)} className="mt-1 w-full flex-wrap justify-start">
            {roles.map((r) => (
              <ToggleGroupItem key={r.value} value={r.value} className="px-4 data-[state=on]:border-primary/50 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">{r.label}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </section>

      <section className="rule-form__section">
        <h2 className="rule-form__title">Ação</h2>
        <div className="field">
          <Label htmlFor="rf-target">Mover para o papel</Label>
          <Select value={targetRole} onValueChange={setTargetRole}>
            <SelectTrigger id="rf-target" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {roles.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="rule-form__foot rule-form__foot--split">
        <Button type="button" variant="outline" size="sm" onClick={() => router.push("/admin/promocoes")} disabled={pending}>Cancelar</Button>
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
