import Link from "next/link";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getConversation, markConversationRead } from "@/lib/messenger";
import { forumDocFromBody } from "@/lib/forum";
import { RichContent } from "@/components/blocks/rich-content";
import type { RichDoc } from "@/lib/blocks/rich-schema";
import { MessageReply } from "@/components/messenger/message-reply";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return {};
  const conv = await getConversation(Number(id), Number(user.id));
  return { title: conv ? conv.subject : "Mensagens" };
}

const posted = (d: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
const initials = (name: string) => (name.trim()[0] ?? "?").toUpperCase();

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const convId = Number(id);
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/entrar?next=/mensagens/${id}`);
  const userId = Number(user.id);

  const conv = await getConversation(convId, userId);
  if (!conv) notFound();
  await markConversationRead(convId, userId);

  return (
    <main id="main" className="page">
      <nav className="forum-crumbs" aria-label="Trilha">
        <Link href="/mensagens" className="link-inline">Mensagens</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Conversa</span>
      </nav>

      <div className="page__head">
        <div>
          <h1 className="page__title">{conv.subject}</h1>
          <p className="page__note">Com {conv.others.map((o) => o.name).join(", ") || "você"}</p>
        </div>
      </div>

      <div className="pm-thread">
        {conv.messages.map((m) => {
          const mine = m.senderId === userId;
          return (
            <article key={m.id} className={cn("pm-msg", mine && "pm-msg--mine")}>
              <span className="pm-msg__avatar" aria-hidden="true">
                {m.senderAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.senderAvatar} alt="" className="size-full object-cover" />
                ) : initials(m.senderName)}
              </span>
              <div className="pm-msg__body">
                <header className="pm-msg__head">
                  <Link href={`/u/${m.senderHandle}`} className="pm-msg__author">{m.senderName}</Link>
                  <time dateTime={m.createdAt.toISOString()}>{posted(m.createdAt)}</time>
                </header>
                <div className="page-w__rich">
                  <RichContent doc={forumDocFromBody(m.body) as RichDoc} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-base font-semibold">Responder</h2>
        <MessageReply conversationId={convId} />
      </div>
    </main>
  );
}
