import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { getCurrentUser, can } from "@/lib/auth-helpers";
import { getRankForReputation } from "@/lib/admin/ranks-db";
import { getAchievementSettings } from "@/lib/settings";
import { getUnreadCount, listNotifications } from "@/lib/notifications";
import { describeNotification } from "@/lib/notification-text";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SearchBox } from "@/components/layout/search-box";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationsBell, type NotifItem } from "@/components/layout/notifications-bell";
import { MobileNav } from "@/components/layout/mobile-nav";

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

export async function SiteHeader() {
  const user = await getCurrentUser();
  const gami = await getAchievementSettings();
  const rank = user && gami.enabled ? await getRankForReputation(user.reputation) : null;
  const { getMenuPages } = await import("@/lib/pages");
  const menuPages = await getMenuPages();

  let unread = 0;
  let notifItems: NotifItem[] = [];
  if (user) {
    // O popup mostra só as não lidas; ao clicar, somem do popup (mas continuam
    // na lista completa em /notificacoes, marcadas como lidas).
    const [count, unreadItems] = await Promise.all([
      getUnreadCount(user.id),
      listNotifications(user.id, { unreadOnly: true }),
    ]);
    unread = count;
    notifItems = unreadItems.slice(0, 8).map((n) => {
      const d = describeNotification(n.type, n.payload);
      return {
        id: n.id,
        text: d.text,
        href: d.href ?? null,
        read: false,
        date: fmtDate(n.createdAt),
        image: d.image ?? null,
        actor: d.actor ?? null,
      };
    });
  }

  return (
    <>
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
          <Button asChild variant="ghost" size="sm">
            <Link href="/blog">Blog</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/missoes">Missões</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/leaderboard">Leaderboard</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/equipe">Equipe</Link>
          </Button>
          {menuPages.map((p) => (
            <Button key={p.slug} asChild variant="ghost" size="sm">
              <Link href={`/p/${p.slug}`}>{p.title}</Link>
            </Button>
          ))}
        </nav>

        <SearchBox className="site-header__search" />

        <div className="site-header__actions">
          <ThemeToggle />
          {user ? (
            <>
              <NotificationsBell unread={unread} items={notifItems} />
              <UserMenu
                handle={user.handle}
                rank={rank!}
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
    <MobileNav
      isLoggedIn={!!user}
      isStaff={can.moderate(user)}
      isAdmin={can.admin(user)}
      handle={user?.handle}
      menuPages={menuPages}
    />
    </>
  );
}
