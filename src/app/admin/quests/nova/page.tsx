import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listBadgesWithCounts } from "@/lib/badges";
import { ROLES, ROLE_LABEL } from "@/lib/admin/role-permissions";
import { QuestForm } from "@/components/admin/quest-form";

export const dynamic = "force-dynamic";

export default async function NewQuestPage() {
  const badges = await listBadgesWithCounts();
  const roles = ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }));
  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/quests"><ChevronLeft className="size-4" aria-hidden="true" /> Missões</Link>
      </Button>
      <h1 className="page__title mt-3">Nova missão</h1>
      <QuestForm
        mode="create"
        initial={{ title: "", description: "", rewardBadge: "", coverImage: "", startsAt: "", endsAt: "", audienceRoles: [], allowOptOut: false, retroactive: false }}
        badges={badges.map((b) => ({ value: b.slug, label: b.name }))}
        roles={roles}
      />
    </>
  );
}
