import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PenLine } from "lucide-react";
import { auth } from "@/auth";
import { getUserDrafts, typeLabel } from "@/lib/articles";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Meu estúdio", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Rascunho", cls: "text-muted-foreground" },
  pending: { label: "Em revisão", cls: "text-amber-600 dark:text-amber-400" },
  changes_requested: { label: "Ajustes pedidos", cls: "text-amber-600 dark:text-amber-400" },
  published: { label: "Publicado", cls: "text-emerald-600 dark:text-emerald-400" },
  rejected: { label: "Rejeitado", cls: "text-destructive" },
  archived: { label: "Arquivado", cls: "text-muted-foreground" },
};

export default async function StudioPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/entrar");

  const drafts = await getUserDrafts(Number(session.user.id));

  return (
    <main id="main" className="page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meu estúdio</h1>
        <Button asChild size="sm">
          <Link href="/estudio/novo">
            <PenLine className="size-4" aria-hidden="true" /> Novo
          </Link>
        </Button>
      </div>

      {drafts.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Você ainda não criou conteúdo. Comece um novo guia ou tutorial.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {drafts.map((d) => {
            const st = STATUS[d.status] ?? { label: d.status, cls: "" };
            const href = d.status === "published" ? `/guias/${d.slug}` : `/estudio/${d.id}`;
            return (
              <li key={d.id}>
                <Link
                  href={href}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
                >
                  <div>
                    <span className="font-medium">{d.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{typeLabel(d.type)}</span>
                  </div>
                  <span className={`text-xs font-medium ${st.cls}`}>{st.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
