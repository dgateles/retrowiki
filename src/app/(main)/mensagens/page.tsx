import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MailPlus, MessagesSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-helpers";
import { listConversations } from "@/lib/messenger";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mensagens" };

const fmt = (d: Date | null) => (d ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d) : "");
const initials = (name: string) => (name.trim()[0] ?? "?").toUpperCase();

export default async function InboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/entrar?next=/mensagens");
  const convs = await listConversations(Number(user.id));

  return (
    <main id="main" className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Mensagens</h1>
          <p className="page__note">Suas conversas privadas.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/mensagens/nova"><MailPlus className="size-4" aria-hidden="true" /> Nova mensagem</Link>
        </Button>
      </div>

      {convs.length === 0 ? (
        <Empty className="mt-6">
          <EmptyHeader>
            <EmptyMedia variant="icon"><MessagesSquare aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>Nenhuma conversa</EmptyTitle>
            <EmptyDescription>Comece uma conversa privada com outro membro.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild size="sm"><Link href="/mensagens/nova"><MailPlus className="size-4" aria-hidden="true" /> Nova mensagem</Link></Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="pm-list">
          {convs.map((c) => {
            const other = c.others[0];
            return (
              <li key={c.id} className={cn("pm-row", c.unread && "pm-row--unread")}>
                <Link href={`/mensagens/${c.id}`} className="pm-row__link">
                  <span className="pm-row__avatar" aria-hidden="true">
                    {other?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={other.avatar} alt="" className="size-full object-cover" />
                    ) : initials(other?.name ?? "?")}
                  </span>
                  <div className="pm-row__main">
                    <span className="pm-row__subject">{c.subject}</span>
                    <span className="pm-row__people">{c.others.map((o) => o.name).join(", ") || "Conversa"}</span>
                    {c.preview && <span className="pm-row__preview">{c.preview}</span>}
                  </div>
                  <div className="pm-row__meta">
                    {c.unread && <span className="pm-dot" aria-label="Não lida" />}
                    <span>{fmt(c.lastMessageAt)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
