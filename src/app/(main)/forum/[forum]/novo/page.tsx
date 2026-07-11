import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getForumBySlug, canReadForumPublic, canPostForum } from "@/lib/forum";
import { forumHref } from "@/lib/forum-url";
import { getCurrentUser, can } from "@/lib/auth-helpers";
import { NewTopicForm } from "@/components/forum/new-topic-form";
import { listPrefixes } from "@/lib/forum-prefixes";

export const dynamic = "force-dynamic";

export default async function NewTopicPage({ params }: { params: Promise<{ forum: string }> }) {
  const { forum } = await params;
  const user = await getCurrentUser();
  const f = await getForumBySlug(forum);
  if (!f || !canReadForumPublic(f, user?.role ?? null)) notFound();
  if (!user) redirect(`/auth/entrar?next=${encodeURIComponent(`/forum/${f.slug}/novo`)}`);
  if (!canPostForum(f, user.role)) notFound();

  const prefixes = (await listPrefixes()).map((p) => ({ id: p.id, label: p.label, color: p.color }));

  return (
    <main id="main" className="page">
      <nav className="forum-crumbs" aria-label="Trilha">
        <Link href="/forum" className="link-inline">Fórum</Link>
        <span aria-hidden="true"> / </span>
        <Link href={forumHref(f.slug)} className="link-inline">{f.title}</Link>
      </nav>
      <div className="page__head">
        <h1 className="page__title">Novo tópico</h1>
      </div>
      <NewTopicForm forumId={f.id} forumSlug={f.slug} isStaff={can.moderate(user)} prefixes={prefixes} />
    </main>
  );
}
