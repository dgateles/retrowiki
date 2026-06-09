import { listReasons, listActions } from "@/lib/warnings";
import { getWarningSettings } from "@/lib/settings";
import { WarningsAdmin } from "@/components/admin/warnings-admin";

export const dynamic = "force-dynamic";

export default async function WarningsAdminPage() {
  const [reasons, actions, settings] = await Promise.all([listReasons(), listActions(), getWarningSettings()]);
  return (
    <>
      <h1 className="page__title">Avisos</h1>
      <p className="page__note">Advertências aos membros: motivos (com pontos), ações por limiar e configurações.</p>
      <WarningsAdmin reasons={reasons} actions={actions} settings={settings} />
    </>
  );
}
