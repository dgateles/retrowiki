import { listDeletionRequests } from "@/lib/privacy";
import { DeletionRequests } from "@/components/admin/deletion-requests";

export const dynamic = "force-dynamic";

export default async function PrivacyAdminPage() {
  const requests = await listDeletionRequests("open");
  return (
    <>
      <h1 className="page__title">Privacidade e dados (LGPD)</h1>
      <p className="page__note">Pedidos de exclusão de conta feitos pelos membros. Anonimizar apaga os dados pessoais e mantém o conteúdo público atribuído a &quot;Usuário removido&quot;.</p>
      <DeletionRequests requests={requests} />
    </>
  );
}
