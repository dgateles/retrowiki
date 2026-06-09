import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listBadgesWithCounts } from "@/lib/badges";
import { rankTiers } from "@/lib/ranks";
import { ROLES, ROLE_LABEL } from "@/lib/admin/role-permissions";
import { getRule } from "@/lib/admin/promotions";
import { PromotionRuleForm } from "@/components/admin/promotion-rule-form";

export const dynamic = "force-dynamic";

export default async function EditRulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ruleId = Number(id);
  if (!Number.isInteger(ruleId) || ruleId <= 0) notFound();
  const rule = await getRule(ruleId);
  if (!rule) notFound();

  const badges = await listBadgesWithCounts();
  const roles = ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }));

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/promocoes"><ChevronLeft className="size-4" aria-hidden="true" /> Promoções</Link>
      </Button>
      <h1 className="page__title mt-3">{rule.name}</h1>

      <PromotionRuleForm
        mode="edit"
        ruleId={rule.id}
        initial={{ name: rule.name, enabled: rule.enabled, sortOrder: rule.sortOrder, targetRole: rule.targetRole, criteria: rule.criteria }}
        badges={badges.map((b) => ({ value: b.slug, label: b.name }))}
        rankTiers={rankTiers()}
        roles={roles}
      />
    </>
  );
}
