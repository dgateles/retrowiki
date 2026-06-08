import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { BlockEditor } from "@/components/editor/block-editor";

export const metadata: Metadata = { title: "Escrever", robots: { index: false } };

export default async function NewArticlePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/entrar");

  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">Escrever conteúdo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Monte o conteúdo com blocos. Ao enviar, ele entra na fila de moderação
        antes de publicar.
      </p>
      <div className="mt-6">
        <BlockEditor />
      </div>
    </main>
  );
}
