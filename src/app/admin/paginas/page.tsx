import Link from "next/link";
import { listPages } from "@/lib/pages";
import { NewPageButton } from "@/components/admin/new-page-button";

export const dynamic = "force-dynamic";

export default async function PagesAdminPage() {
  const items = await listPages();
  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="page__title">Páginas</h1>
          <p className="page__note">Monte páginas próprias (Sobre, Regras, landing) no construtor visual. Header e rodapé continuam fixos.</p>
        </div>
        <NewPageButton />
      </div>

      {items.length === 0 ? (
        <p className="empty mt-8">Nenhuma página ainda. Crie a primeira.</p>
      ) : (
        <ul className="admin-list mt-6">
          {items.map((p) => (
            <li key={p.id} className="admin-list__row">
              <span className="min-w-0">
                <Link href={`/construtor/${p.id}`} className="admin-list__title">{p.title}</Link>
                <span className="admin-list__meta">/p/{p.slug}{p.showInMenu && " · no menu"}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className={`status-pill status-pill--${p.status === "published" ? "published" : "draft"}`}>
                  {p.status === "published" ? "Publicada" : "Rascunho"}
                </span>
                {p.status === "published" && (
                  <Link href={`/p/${p.slug}`} className="link-inline text-sm" target="_blank">ver</Link>
                )}
                <Link href={`/construtor/${p.id}`} className="link-inline text-sm">editar</Link>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
