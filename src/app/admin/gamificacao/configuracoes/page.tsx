import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAchievementSettings } from "@/lib/settings";
import { AchievementSettingsForm } from "@/components/admin/achievement-settings-form";

export const dynamic = "force-dynamic";

export default async function AchievementSettingsPage() {
  const settings = await getAchievementSettings();

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/gamificacao"><ChevronLeft className="size-4" aria-hidden="true" /> Gamificação</Link>
      </Button>
      <h1 className="page__title mt-3">Configurações de conquistas</h1>
      <p className="page__note">Controle global da gamificação.</p>

      <AchievementSettingsForm initial={settings} />
    </>
  );
}
