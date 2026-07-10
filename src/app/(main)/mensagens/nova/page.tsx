import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { MessageComposer } from "@/components/messenger/message-composer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nova mensagem" };

export default async function NewMessagePage({ searchParams }: { searchParams: Promise<{ para?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/entrar?next=/mensagens/nova");
  const { para } = await searchParams;
  const recipient = typeof para === "string" ? para.replace(/^@/, "").slice(0, 60) : "";

  return (
    <main id="main" className="page">
      <nav className="forum-crumbs" aria-label="Trilha">
        <Link href="/mensagens" className="link-inline">Mensagens</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Nova</span>
      </nav>
      <div className="page__head"><h1 className="page__title">Nova mensagem</h1></div>
      <div className="mt-4 rounded-lg border border-border bg-card p-5">
        <MessageComposer recipient={recipient} />
      </div>
    </main>
  );
}
