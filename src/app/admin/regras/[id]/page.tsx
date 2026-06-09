import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listBadgesWithCounts } from "@/lib/badges";
import { TRIGGERS, getRule } from "@/lib/achievements";
import { AchievementRuleForm } from "@/components/admin/achievement-rule-form";

export const dynamic = "force-dynamic";

export default async function EditAchievementRulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ruleId = Number(id);
  if (!Number.isInteger(ruleId) || ruleId <= 0) notFound();
  const rule = await getRule(ruleId);
  if (!rule) notFound();

  const badges = await listBadgesWithCounts();
  const triggers = Object.entries(TRIGGERS).map(([key, def]) => ({ key, label: def.label, recipients: def.recipients }));

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/regras"><ChevronLeft className="size-4" aria-hidden="true" /> Regras</Link>
      </Button>
      <h1 className="page__title mt-3">{rule.name}</h1>

      <AchievementRuleForm
        mode="edit"
        ruleId={rule.id}
        initial={{ name: rule.name, trigger: rule.trigger, milestone: rule.milestone, enabled: rule.enabled, sortOrder: rule.sortOrder, rewards: rule.rewards }}
        triggers={triggers}
        badges={badges.map((b) => ({ value: b.slug, label: b.name }))}
      />
    </>
  );
}
