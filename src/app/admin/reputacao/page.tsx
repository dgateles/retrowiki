import { getReputationSettings } from "@/lib/settings";
import { listReactions } from "@/lib/reactions";
import { listLevels } from "@/lib/reputation-levels";
import { ReputationTabs } from "@/components/admin/reputation-tabs";

export const dynamic = "force-dynamic";

export default async function ReputationAdminPage() {
  const [settings, reactions, levels] = await Promise.all([getReputationSettings(), listReactions(), listLevels()]);
  return (
    <>
      <h1 className="page__title">Reputação & Reações</h1>
      <p className="page__note">Reações nos guias, regras de reputação, leaderboard e níveis.</p>
      <ReputationTabs settings={settings} reactions={reactions} levels={levels} />
    </>
  );
}
