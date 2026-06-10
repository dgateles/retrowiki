import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { auth } from "@/auth";
import { getArticleForEdit } from "@/lib/articles";
import { isRichDoc } from "@/lib/blocks/rich-schema";
import { BlockEditor } from "@/components/editor/block-editor";
import { RichArticleEditor } from "@/components/editor/rich-article-editor";

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

  const published = article.status === "published";
  const body: unknown = article.body;

  return (
    <main id="main" className="page">
      <h1 className="page__title">Editar conteúdo</h1>
      <p className="page__note">
        {published
          ? "Este guia está no ar. Sua alteração vai para revisão e só substitui a versão atual quando aprovada."
          : "Ao enviar, o conteúdo volta para a fila de moderação."}
      </p>
      <div className="mt-6">
        {isRichDoc(body) ? (
          <RichArticleEditor
            initial={{ articleId: article.id, title: article.title, type: article.type, kind: article.kind, coverImage: article.coverImage, doc: body as JSONContent, published }}
          />
        ) : (
          <BlockEditor
            initial={{
              articleId: article.id,
              title: article.title,
              type: article.type,
              blocks: article.body.blocks,
              published,
            }}
          />
        )}
      </div>
    </main>
  );
}
