import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getArticleForEdit } from "@/lib/articles";
import { BlockEditor } from "@/components/editor/block-editor";

export const metadata: Metadata = { title: "Editar", robots: { index: false } };

export default async function EditDraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/entrar");

  const { id } = await params;
  const article = await getArticleForEdit(Number(id));
  if (!article) notFound();
  if (article.authorId !== Number(session.user.id)) notFound();
  if (article.status === "published") redirect(`/guias`);

  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">Editar conteúdo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ao enviar, o conteúdo volta para a fila de moderação.
      </p>
      <div className="mt-6">
        <BlockEditor
          initial={{
            articleId: article.id,
            title: article.title,
            type: article.type,
            blocks: article.body.blocks,
          }}
        />
      </div>
    </main>
  );
}
