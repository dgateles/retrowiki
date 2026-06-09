import { getNotificationsConfig } from "@/lib/notifications-prefs";
import { NotificationsConfigForm } from "@/components/admin/notifications-config-form";

export const dynamic = "force-dynamic";

export default async function NotificationsAdminPage() {
  const config = await getNotificationsConfig();
  return (
    <>
      <h1 className="page__title">Notificações</h1>
      <p className="page__note">Tipos de notificação, canais e padrões. Os membros ajustam suas preferências em Conta.</p>
      <NotificationsConfigForm config={config} />
    </>
  );
}
