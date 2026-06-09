import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listBadgesWithCounts } from "@/lib/badges";
import { QuestForm } from "@/components/admin/quest-form";

export const dynamic = "force-dynamic";

export default async function NewQuestPage() {
  const badges = await listBadgesWithCounts();
  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/quests"><ChevronLeft className="size-4" aria-hidden="true" /> Missões</Link>
      </Button>
      <h1 className="page__title mt-3">Nova missão</h1>
      <QuestForm mode="create" initial={{ title: "", description: "", rewardBadge: "" }} badges={badges.map((b) => ({ value: b.slug, label: b.name }))} />
    </>
  );
}
