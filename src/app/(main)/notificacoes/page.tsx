import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { auth } from "@/auth";
import { listNotifications } from "@/lib/notifications";
import { describeNotification } from "@/lib/notification-text";
import { markNotificationsReadAction } from "@/lib/actions/notification-actions";
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notificações</h1>
        {hasUnread && (
          <form action={markNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm">
              Marcar todas como lidas
            </Button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center">
          <Bell className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">Nada por aqui ainda.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((n) => {
            const d = describeNotification(n.type, n.payload);
            const inner = (
              <div className={`rounded-lg border p-4 ${n.readAt ? "border-border bg-card" : "border-primary/40 bg-primary/5"}`}>
                <p className="text-sm">{d.text}</p>
                <time className="mt-1 block text-xs text-muted-foreground" dateTime={new Date(n.createdAt).toISOString()}>
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(n.createdAt))}
                </time>
              </div>
            );
            return <li key={n.id}>{d.href ? <Link href={d.href}>{inner}</Link> : inner}</li>;
          })}
        </ul>
      )}
    </main>
  );
}
