import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RankForm } from "@/components/admin/rank-form";

export const dynamic = "force-dynamic";

export default function NewRankPage() {
  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/ranks"><ChevronLeft className="size-4" aria-hidden="true" /> Ranks</Link>
      </Button>
      <h1 className="page__title mt-3">Novo rank</h1>
      <RankForm mode="create" initial={{ title: "", points: 0, icon: "Shield" }} />
    </>
  );
}
