import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { getCurrentUser, can } from "@/lib/auth-helpers";
import { getUnreadCount, listNotifications } from "@/lib/notifications";
import { describeNotification } from "@/lib/notification-text";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SearchBox } from "@/components/layout/search-box";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationsBell, type NotifItem } from "@/components/layout/notifications-bell";

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

export async function SiteHeader() {
  const user = await getCurrentUser();

  let unread = 0;
  let notifItems: NotifItem[] = [];
  if (user) {
    const [count, all] = await Promise.all([getUnreadCount(user.id), listNotifications(user.id)]);
    unread = count;
    notifItems = all.slice(0, 6).map((n) => {
      const d = describeNotification(n.type, n.payload);
      return { id: n.id, text: d.text, href: d.href ?? null, read: Boolean(n.readAt), date: fmtDate(n.createdAt) };
    });
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand">
          <Gamepad2 className="brand-icon" aria-hidden="true" />
          RetroWiki
        </Link>

        <nav aria-label="Principal" className="site-header__nav">
          <Button asChild variant="ghost" size="sm">
            <Link href="/consoles">Consoles</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/guias">Guias</Link>
          </Button>
        </nav>

        <SearchBox className="site-header__search" />

        <div className="site-header__actions">
          <ThemeToggle />
          {user ? (
            <>
              <NotificationsBell unread={unread} items={notifItems} />
              <UserMenu
                handle={user.handle}
                reputation={user.reputation}
                isStaff={can.moderate(user)}
                isAdmin={can.admin(user)}
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/entrar">Entrar</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/cadastrar">Criar conta</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
