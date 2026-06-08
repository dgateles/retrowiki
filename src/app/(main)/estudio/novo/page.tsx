import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { RichArticleEditor } from "@/components/editor/rich-article-editor";

export const metadata: Metadata = { title: "Escrever", robots: { index: false } };

export default async function NewArticlePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/entrar");

  return (
    <main id="main" className="page">
      <h1 className="page__title">Escrever conteúdo</h1>
      <p className="page__note">
        Escreva com o editor. Ao enviar, o conteúdo entra na fila de moderação
        antes de publicar.
      </p>
      <div className="mt-6">
        <RichArticleEditor />
      </div>
    </main>
  );
}
