import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRankRows } from "@/lib/admin/ranks-db";
import { RankForm } from "@/components/admin/rank-form";

export const dynamic = "force-dynamic";

export default async function EditRankPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rankId = Number(id);
  if (!Number.isInteger(rankId) || rankId <= 0) notFound();
  const rows = await getRankRows();
  const rank = rows.find((r) => r.id === rankId);
  if (!rank) notFound();

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/ranks"><ChevronLeft className="size-4" aria-hidden="true" /> Ranks</Link>
      </Button>
      <h1 className="page__title mt-3">{rank.title}</h1>
      <RankForm mode="edit" rankId={rank.id} initial={{ title: rank.title, points: rank.points, icon: rank.icon }} />
    </>
  );
}
