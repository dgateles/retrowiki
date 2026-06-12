import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { auth } from "@/auth";
import { getArticleForEdit } from "@/lib/articles";
import { isRichDoc } from "@/lib/blocks/rich-schema";
import { BlockTreeSchema } from "@/lib/blocks/schema";
import { blockTreeToRichDoc } from "@/lib/blocks/convert";
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

  const userId = Number(session.user.id);
  const isAuthor = article.authorId === userId;
  const isStaff = session.user.role === "moderator" || session.user.role === "admin";
  const published = article.status === "published";
  // Conteúdo não publicado é privado do autor (e da equipe). Já no ar pode
  // receber sugestões de qualquer membro (modelo wiki) — vão para a fila.
  if (!published && !isAuthor && !isStaff) notFound();

  // A edição usa SEMPRE o editor rico. Conteúdo legado (árvore de blocos) é
  // convertido para o documento rico ao carregar; ao salvar, o guia passa a ser
  // armazenado no formato rico.
  const rawBody: unknown = article.body;
  let doc: JSONContent;
  if (isRichDoc(rawBody)) {
    doc = rawBody as JSONContent;
  } else {
    const parsed = BlockTreeSchema.safeParse(rawBody);
    doc = parsed.success
      ? (blockTreeToRichDoc(parsed.data) as unknown as JSONContent)
      : { type: "doc", content: [{ type: "paragraph" }] };
  }

  return (
    <main id="main" className="page">
      <h1 className="page__title">{published && !isAuthor ? "Sugerir edição" : "Editar conteúdo"}</h1>
      <p className="page__note">
        {published
          ? isAuthor
            ? "Este guia está no ar. Sua alteração vai para revisão e só substitui a versão atual quando aprovada."
            : "Você está sugerindo uma edição. Descreva o que mudou na justificativa; a sugestão vai para a fila de moderação e a versão atual continua no ar até ser aprovada."
          : "Ao enviar, o conteúdo volta para a fila de moderação."}
      </p>
      <div className="mt-6">
        <RichArticleEditor
          initial={{ articleId: article.id, title: article.title, type: article.type, kind: article.kind, coverImage: article.coverImage, doc, published, isAuthor }}
        />
      </div>
    </main>
  );
}
