import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PenLine, Newspaper } from "lucide-react";
import { auth } from "@/auth";
import { can } from "@/lib/auth-helpers";
import { getUserDrafts, typeLabel } from "@/lib/articles";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Meu estúdio", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; mod: string }> = {
  draft: { label: "Rascunho", mod: "status--muted" },
  pending: { label: "Em revisão", mod: "status--warn" },
  changes_requested: { label: "Ajustes pedidos", mod: "status--warn" },
  published: { label: "Publicado", mod: "status--ok" },
  rejected: { label: "Rejeitado", mod: "status--bad" },
  archived: { label: "Arquivado", mod: "status--muted" },
};

export default async function StudioPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/entrar");

  const drafts = await getUserDrafts(Number(session.user.id));
  const canBlog = can.moderate(session.user);

  return (
    <main id="main" className="page">
      <div className="page__head">
        <h1 className="page__title">Meu estúdio</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm">
            <Link href="/estudio/novo">
              <PenLine className="size-4" aria-hidden="true" /> Novo guia
            </Link>
          </Button>
          {canBlog && (
            <Button asChild size="sm" variant="outline">
              <Link href="/estudio/novo?kind=blog">
                <Newspaper className="size-4" aria-hidden="true" /> Novo post do blog
              </Link>
            </Button>
          )}
        </div>
      </div>

      {drafts.length === 0 ? (
        <p className="empty mt-8">
          Você ainda não criou conteúdo. Comece um novo guia ou tutorial.
        </p>
      ) : (
        <ul className="link-list">
          {drafts.map((d) => {
            const st = STATUS[d.status] ?? { label: d.status, mod: "status--muted" };
            const href = d.status === "published" ? `/${d.kind === "blog" ? "blog" : "guias"}/${d.slug}` : `/estudio/${d.id}`;
            return (
              <li key={d.id}>
                <Link href={href} className="link-card">
                  <span>
                    <span className="link-card__title">{d.title}</span>
                    <span className="link-card__meta">{typeLabel(d.type)}</span>
                  </span>
                  <span className={`status ${st.mod}`}>{st.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
