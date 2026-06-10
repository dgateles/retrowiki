import Link from "next/link";
import { Search } from "lucide-react";
import { listAllArticlesForAdmin, articleStatusCounts, ARTICLE_STATUSES, STATUS_LABEL } from "@/lib/admin/articles";
import { ArticleActions } from "@/components/admin/article-actions";
import { Pager } from "@/components/ui/pager";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d));

export default async function AdminArticlesPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; status?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q ?? "";
  const status = sp.status ?? "";
  const [{ items, hasMore }, counts] = await Promise.all([
    listAllArticlesForAdmin({ page, q, status }),
    articleStatusCounts(),
  ]);

  const tabs = [{ key: "", label: "Todos" }, ...ARTICLE_STATUSES.map((s) => ({ key: s, label: STATUS_LABEL[s] }))];
  const linkFor = (s: string) => `/admin/artigos${s ? `?status=${s}` : ""}`;

  return (
    <>
      <h1 className="page__title">Artigos</h1>
      <p className="page__note">Todos os guias, em qualquer status. Arquivar tira do ar; publicar coloca no ar.</p>

      <div className="perm-form__tabs mt-6" role="tablist" aria-label="Status">
        {tabs.map((t) => (
          <Link key={t.key} href={linkFor(t.key)} role="tab" aria-selected={status === t.key} className={cn("perm-form__tab", status === t.key && "perm-form__tab--active")}>
            {t.label}{t.key && counts[t.key] ? ` (${counts[t.key]})` : ""}
          </Link>
        ))}
      </div>

      <form method="get" role="search" className="search mt-5">
        <Search className="search__icon" aria-hidden="true" />
        <input type="search" name="q" defaultValue={q} placeholder="Buscar por título…" aria-label="Buscar artigos" className="search__input" />
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      {items.length === 0 ? (
        <p className="empty mt-6">Nenhum artigo encontrado.</p>
      ) : (
        <ul className="pf-groups mt-5">
          {items.map((a) => (
            <li key={a.id} className="pf-group">
              <div className="report-row">
                <div className="min-w-0">
                  <p className="report-row__title">
                    <Link href={`/guias/${a.slug}`} className="link-inline" target="_blank">{a.title}</Link>
                    <span className={cn("status-pill", `status-pill--${a.status}`)}>{STATUS_LABEL[a.status]}</span>
                  </p>
                  <p className="pf-field__meta">por {a.authorHandle ? <Link href={`/u/${a.authorHandle}`} className="link-inline">{a.authorName}</Link> : a.authorName} · criado {fmt(a.createdAt)}{a.publishedAt ? ` · publicado ${fmt(a.publishedAt)}` : ""}</p>
                </div>
                <ArticleActions id={a.id} status={a.status} title={a.title} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pager path="/admin/artigos" page={page} hasMore={hasMore} params={{ q, status }} />
    </>
  );
}
