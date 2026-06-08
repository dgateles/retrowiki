import Link from "next/link";
import { Gamepad2, Bell, PenLine, ShieldCheck, Search, UserRound } from "lucide-react";
import { auth } from "@/auth";
import { getUnreadCount } from "@/lib/notifications";
import { can } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/layout/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  const unread = user ? await getUnreadCount(Number(user.id)) : 0;

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Gamepad2 className="size-5 text-primary" aria-hidden="true" />
          RetroWiki
        </Link>

        <nav aria-label="Principal" className="flex items-center gap-0.5 sm:gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Buscar">
            <Link href="/buscar">
              <Search className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/consoles">Consoles</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/guias">Guias</Link>
          </Button>
          <ThemeToggle />

          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/estudio">
                  <PenLine className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Escrever</span>
                </Link>
              </Button>
              {can.moderate(user) && (
                <Button asChild variant="ghost" size="icon" aria-label="Moderação">
                  <Link href="/moderacao">
                    <ShieldCheck className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              )}
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
              <Button asChild variant="ghost" size="icon" aria-label="Minha conta">
                <Link href="/conta">
                  <UserRound className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <LogoutButton />
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
        </nav>
      </div>
    </header>
  );
}
