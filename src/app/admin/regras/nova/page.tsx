import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listBadgesWithCounts } from "@/lib/badges";
import { TRIGGERS } from "@/lib/achievements";
import { AchievementRuleForm } from "@/components/admin/achievement-rule-form";

export const dynamic = "force-dynamic";

export default async function NewAchievementRulePage() {
  const badges = await listBadgesWithCounts();
  const triggers = Object.entries(TRIGGERS).map(([key, def]) => ({ key, label: def.label, recipients: def.recipients }));
  const first = triggers[0];

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/regras"><ChevronLeft className="size-4" aria-hidden="true" /> Regras</Link>
      </Button>
      <h1 className="page__title mt-3">Nova regra de conquista</h1>

      <AchievementRuleForm
        mode="create"
        initial={{ name: "", trigger: first.key, milestone: 0, enabled: true, sortOrder: 0, rewards: {} }}
        triggers={triggers}
        badges={badges.map((b) => ({ value: b.slug, label: b.name }))}
      />
    </>
  );
}
