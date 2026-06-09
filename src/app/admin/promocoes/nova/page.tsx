import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listBadgesWithCounts } from "@/lib/badges";
import { rankTiers } from "@/lib/ranks";
import { ROLES, ROLE_LABEL } from "@/lib/admin/role-permissions";
import { DEFAULT_CRITERIA } from "@/lib/admin/promotions";
import { PromotionRuleForm } from "@/components/admin/promotion-rule-form";

export const dynamic = "force-dynamic";

export default async function NewRulePage() {
  const badges = await listBadgesWithCounts();
  const roles = ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }));

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/promocoes"><ChevronLeft className="size-4" aria-hidden="true" /> Promoções</Link>
      </Button>
      <h1 className="page__title mt-3">Nova regra</h1>

      <PromotionRuleForm
        mode="create"
        initial={{ name: "", enabled: true, sortOrder: 0, targetRole: "contributor", criteria: DEFAULT_CRITERIA }}
        badges={badges.map((b) => ({ value: b.slug, label: b.name }))}
        rankTiers={rankTiers()}
        roles={roles}
      />
    </>
  );
}
