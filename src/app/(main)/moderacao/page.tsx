import Link from "next/link";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser, can } from "@/lib/auth-helpers";
import { getModerationQueue, getRevisionBody, typeLabel } from "@/lib/articles";
import { getPendingReviewCount, getRecentAudit, auditLabel } from "@/lib/panel";
import { ArticleBody } from "@/lib/blocks/render";
import { ModerationActions } from "@/components/moderation/moderation-actions";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/ui/pager";

const fmtAudit = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

export const metadata: Metadata = { title: "Moderação", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const user = await getCurrentUser();
  if (!can.moderate(user)) {
    return (
      <main id="main" className="page restricted">
        <ShieldAlert className="restricted__icon" aria-hidden="true" />
        <h1 className="restricted__title">Acesso restrito</h1>
        <p className="restricted__text">Esta área é exclusiva para moderadores.</p>
        <Button asChild className="mt-6">
          <Link href="/">Início</Link>
        </Button>
      </main>
    );
  }

  const [{ items: queue, hasMore }, pending, recentAudit] = await Promise.all([
    getModerationQueue(page),
    getPendingReviewCount(),
    getRecentAudit(8),
  ]);
  const withBodies = await Promise.all(
    queue.map(async (q) => ({ ...q, body: await getRevisionBody(q.revisionId) })),
  );

  return (
    <main id="main" className="page">
      <h1 className="page__title">Moderação</h1>

      <dl className="stat-cards">
        <div className="stat-card">
          <dd className="stat-card__value">{pending}</dd>
          <dt className="stat-card__label">Na fila</dt>
        </div>
        <div className="stat-card">
          <dd className="stat-card__value">{recentAudit.length}</dd>
          <dt className="stat-card__label">Ações recentes</dt>
        </div>
      </dl>

      {recentAudit.length > 0 && (
        <section aria-labelledby="mod-recent" className="panel-section mt-6">
          <div className="panel-section__head">
            <h2 id="mod-recent" className="panel-section__title">Atividade recente da equipe</h2>
          </div>
          <ul>
            {recentAudit.map((a) => (
              <li key={a.id} className="audit-item">
                <span>
                  {a.actorHandle ? <strong>@{a.actorHandle}</strong> : "Sistema"} {auditLabel(a.action)}
                </span>
                <time className="audit-item__date" dateTime={new Date(a.createdAt).toISOString()}>
                  {fmtAudit(a.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="subtitle mt-8">Fila de revisão</h2>
      <p className="page__note" role="status">
        {queue.length} {queue.length === 1 ? "item nesta página" : "itens nesta página"}
      </p>

      {withBodies.length === 0 ? (
        <p className="empty mt-8">Nada pendente. Bom trabalho.</p>
      ) : (
        <ul className="mod-list">
          {withBodies.map((q) => (
            <li key={q.reviewId} className="mod-item">
              <div className="mod-item__head">
                <div>
                  <span className="mod-item__kind">{typeLabel(q.type)}</span>
                  <h2 className="mod-item__title">{q.title}</h2>
                  <p className="mod-item__author">por @{q.authorHandle}</p>
                </div>
                <ModerationActions reviewId={q.reviewId} />
              </div>
              <details className="mod-preview">
                <summary className="mod-preview__summary">Pré-visualizar conteúdo</summary>
                <div className="mod-preview__body">
                  {q.body ? <ArticleBody body={q.body} /> : <p>Conteúdo inválido.</p>}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
      <Pager path="/moderacao" page={page} hasMore={hasMore} />
    </main>
  );
}
