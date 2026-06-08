import Link from "next/link";
import { Gamepad2, Bell } from "lucide-react";
import { auth } from "@/auth";
import { getUnreadCount } from "@/lib/notifications";
import { can } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SearchBox } from "@/components/layout/search-box";
import { UserMenu } from "@/components/layout/user-menu";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  const unread = user ? await getUnreadCount(Number(user.id)) : 0;

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand">
          <Gamepad2 className="size-5 text-primary" aria-hidden="true" />
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
              <Button asChild variant="ghost" size="icon" className="relative" aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`}>
                <Link href="/notificacoes">
                  <Bell className="size-4" aria-hidden="true" />
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              </Button>
              <UserMenu handle={user.handle} isStaff={can.moderate(user)} />
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
