import { listAllAnnouncements } from "@/lib/announcements";
import { AnnouncementsAdmin } from "@/components/admin/announcements-admin";

export const dynamic = "force-dynamic";

export default async function AnnouncementsAdminPage() {
  const items = await listAllAnnouncements();
  return (
    <>
      <h1 className="page__title">Anúncios</h1>
      <p className="page__note">Avisos exibidos no topo do site para todos os visitantes. Cada um pode ser dispensado pelo leitor.</p>
      <AnnouncementsAdmin items={items} />
    </>
  );
}
