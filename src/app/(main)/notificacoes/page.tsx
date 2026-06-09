import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { auth } from "@/auth";
import { listNotifications } from "@/lib/notifications";
import { describeNotification } from "@/lib/notification-text";
import { markNotificationsReadAction } from "@/lib/actions/notification-actions";
import { NotifDelete } from "@/components/notifications/notif-delete";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Notificações", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/entrar");

  const items = await listNotifications(Number(session.user.id));
  const hasUnread = items.some((n) => !n.readAt);

  return (
    <main id="main" className="page">
      <div className="page__head">
        <h1 className="page__title">Notificações</h1>
        {hasUnread && (
          <form action={markNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm">
              Marcar todas como lidas
            </Button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty mt-8">
          <Bell className="empty__icon" aria-hidden="true" />
          <p className="empty__text">Nada por aqui ainda.</p>
        </div>
      ) : (
        <ul className="notif-list">
          {items.map((n) => {
            const d = describeNotification(n.type, n.payload);
            const inner = (
              <div className={`notif ${n.readAt ? "notif--read" : "notif--unread"}`}>
                <p className="notif__text">{d.text}</p>
                <div className="notif__foot">
                  <time className="notif__date" dateTime={new Date(n.createdAt).toISOString()}>
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(n.createdAt))}
                  </time>
                  {n.readAt && (
                    <span className="notif__read">
                      <CheckCheck className="size-3.5" aria-hidden="true" /> Lida
                    </span>
                  )}
                </div>
              </div>
            );
            return (
              <li key={n.id} className="notif-row">
                {d.href ? <Link href={d.href} className="notif-row__link">{inner}</Link> : <div className="notif-row__link">{inner}</div>}
                <NotifDelete id={n.id} />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
