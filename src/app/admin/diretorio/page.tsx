import { listCategories, listEntries } from "@/lib/staff-directory";
import { StaffDirectoryAdmin } from "@/components/admin/staff-directory-admin";

export const dynamic = "force-dynamic";

export default async function StaffDirectoryAdminPage() {
  const cats = await listCategories();
  const withEntries = await Promise.all(cats.map(async (c) => ({ ...c, entries: await listEntries(c.id) })));
  return (
    <>
      <h1 className="page__title">Diretório da equipe</h1>
      <p className="page__note">Monte a página pública <strong>/equipe</strong>: categorias com membros (nome, título e bio) ou grupos inteiros.</p>
      <StaffDirectoryAdmin categories={withEntries} />
    </>
  );
}
