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
      <main id="main" className="page text-center">
        <ShieldAlert className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-3 text-xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é exclusiva para moderadores.
        </p>
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
      <h1 className="text-3xl font-bold">Fila de moderação</h1>
      <p className="mt-2 text-sm text-muted-foreground" role="status">
        {queue.length} {queue.length === 1 ? "item nesta página" : "itens nesta página"}
      </p>

      {withBodies.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nada pendente. Bom trabalho.
        </p>
      ) : (
        <ul className="mt-6 space-y-6">
          {withBodies.map((q) => (
            <li key={q.reviewId} className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-primary">{typeLabel(q.type)}</span>
                  <h2 className="font-semibold">{q.title}</h2>
                  <p className="text-xs text-muted-foreground">por @{q.authorHandle}</p>
                </div>
                <ModerationActions reviewId={q.reviewId} />
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Pré-visualizar conteúdo
                </summary>
                <div className="mt-3 rounded-md border border-border/60 p-4 text-sm">
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
