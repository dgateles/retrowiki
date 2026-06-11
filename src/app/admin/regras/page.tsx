import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensureDefaultRules, listRules, TRIGGERS, type Rewards } from "@/lib/achievements";
import { AchievementRuleDelete } from "@/components/admin/achievement-rule-delete";

export const dynamic = "force-dynamic";

function ordinal(n: number) {
  return `${n}ª`;
}

function summarize(trigger: string, rewards: Rewards): string {
  const def = TRIGGERS[trigger];
  if (!def) return "";
  const parts: string[] = [];
  for (const rec of def.recipients) {
    const r = rewards[rec.key];
    if (!r) continue;
    const bits: string[] = [];
    if (r.points > 0) bits.push(`+${r.points} pts`);
    if (r.badge) bits.push(`badge ${r.badge}`);
    if (bits.length) parts.push(`${rec.label}: ${bits.join(", ")}`);
  }
  return parts.join(" · ") || "Sem recompensa";
}

export default async function AchievementRulesPage() {
  await ensureDefaultRules();
  const rules = await listRules();

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="page__title">Regras de conquista</h1>
          <p className="page__note">Concedem pontos e badges quando uma ação acontece. Os pontos alimentam os ranks.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/regras/nova"><Plus className="size-4" aria-hidden="true" /> Nova regra</Link>
        </Button>
      </div>

      {rules.length === 0 ? (
        <p className="empty mt-6">Nenhuma regra ainda.</p>
      ) : (
        <ul className="rule-list">
          {rules.map((r) => (
            <li key={r.id} className="rule-row">
              <span className={`rule-row__status${r.enabled ? " rule-row__status--on" : ""}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="rule-row__name">
                  {TRIGGERS[r.trigger]?.label ?? r.trigger}
                  {r.milestone > 0 && <span className="rule-row__milestone"> {ordinal(r.milestone)} ação</span>}
                </p>
                <p className="rule-row__meta">{summarize(r.trigger, r.rewards)}{!r.enabled && " · pausada"}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="ml-auto">
                <Link href={`/admin/regras/${r.id}`} aria-label={`Editar ${r.name}`}>
                  <Pencil className="size-4" aria-hidden="true" /> Editar
                </Link>
              </Button>
              <AchievementRuleDelete id={r.id} name={r.name} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
