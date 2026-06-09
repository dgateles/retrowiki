import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeForm } from "@/components/admin/badge-form";

export const dynamic = "force-dynamic";

export default function NewBadgePage() {
  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/badges"><ChevronLeft className="size-4" aria-hidden="true" /> Badges</Link>
      </Button>
      <h1 className="page__title mt-3">Nova badge</h1>
      <BadgeForm mode="create" initial={{ name: "", description: "", icon: "Award", tier: "bronze", manuallyAwardable: true }} />
    </>
  );
}
