import Link from "next/link";
import { Plus } from "lucide-react";
import { listAllDevices } from "@/lib/admin/devices";
import { Button } from "@/components/ui/button";

const STATUS: Record<string, { label: string; mod: string }> = {
  published: { label: "Publicado", mod: "status--ok" },
  draft: { label: "Rascunho", mod: "status--muted" },
  archived: { label: "Arquivado", mod: "status--muted" },
};

export default async function AdminConsolesPage() {
  const items = await listAllDevices();

  return (
    <>
      <div className="page__head">
        <h1 className="page__title">Consoles</h1>
        <Button asChild size="sm">
          <Link href="/admin/consoles/novo">
            <Plus className="size-4" aria-hidden="true" /> Novo
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="empty mt-6">Nenhum console cadastrado.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="admin-table">
            <caption className="sr-only">Lista de consoles</caption>
            <thead>
              <tr>
                <th scope="col" className="admin-table__th">Nome</th>
                <th scope="col" className="admin-table__th">Fabricante</th>
                <th scope="col" className="admin-table__th">Ano</th>
                <th scope="col" className="admin-table__th">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => {
                const st = STATUS[d.status] ?? { label: d.status, mod: "status--muted" };
                return (
                  <tr key={d.id} className="admin-table__row">
                    <td className="admin-table__td">
                      <Link href={`/admin/consoles/${d.id}`} className="link-inline">{d.name}</Link>
                    </td>
                    <td className="admin-table__td">{d.manufacturer}</td>
                    <td className="admin-table__td">{d.releaseYear ?? "—"}</td>
                    <td className="admin-table__td">
                      <span className={`status ${st.mod}`}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
