import { listBanFilters } from "@/lib/admin/ban-filters";
import { BanFilters } from "@/components/admin/ban-filters";

export const dynamic = "force-dynamic";

export default async function BanSettingsPage() {
  const filters = await listBanFilters();
  return (
    <>
      <h1 className="page__title">Banimentos</h1>
      <p className="page__note">Bloqueie cadastro e login por e-mail, IP ou nome de usuário. Aceita curinga (*).</p>
      <BanFilters filters={filters} />
    </>
  );
}
