import { getReportQueue, listReportTypes } from "@/lib/reports";
import { getReportingSettings } from "@/lib/settings";
import { ReportsAdmin } from "@/components/admin/reports-admin";

export const dynamic = "force-dynamic";

export default async function ReportsAdminPage() {
  const [queue, types, settings] = await Promise.all([getReportQueue(), listReportTypes(), getReportingSettings()]);
  return (
    <>
      <h1 className="page__title">Denúncias</h1>
      <p className="page__note">Fila de conteúdo denunciado, tipos de denúncia e moderação automática.</p>
      <ReportsAdmin queue={queue} types={types} settings={settings} />
    </>
  );
}
