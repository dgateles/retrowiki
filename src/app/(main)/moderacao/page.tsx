import Link from "next/link";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser, can } from "@/lib/auth-helpers";
import { getModerationQueue, getRevisionBody, typeLabel } from "@/lib/articles";
import { ArticleBody } from "@/lib/blocks/render";
import { ModerationActions } from "@/components/moderation/moderation-actions";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/ui/pager";

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

  const { items: queue, hasMore } = await getModerationQueue(page);
  const withBodies = await Promise.all(
    queue.map(async (q) => ({ ...q, body: await getRevisionBody(q.revisionId) })),
  );

  return (
    <main id="main" className="page">
      <h1 className="page__title">Fila de moderação</h1>
      <p className="mt-2 text-sm text-muted-foreground" role="status">
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
