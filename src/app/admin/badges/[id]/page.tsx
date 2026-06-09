import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBadge } from "@/lib/badges";
import { BadgeForm } from "@/components/admin/badge-form";

export const dynamic = "force-dynamic";

export default async function EditBadgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const badgeId = Number(id);
  if (!Number.isInteger(badgeId) || badgeId <= 0) notFound();
  const badge = await getBadge(badgeId);
  if (!badge) notFound();

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/badges"><ChevronLeft className="size-4" aria-hidden="true" /> Badges</Link>
      </Button>
      <h1 className="page__title mt-3">{badge.name}</h1>
      <BadgeForm
        mode="edit"
        badgeId={badge.id}
        initial={{ name: badge.name, description: badge.description, icon: badge.icon, tier: badge.tier, manuallyAwardable: badge.manuallyAwardable }}
      />
    </>
  );
}
