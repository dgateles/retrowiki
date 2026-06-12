"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home, Gamepad2, BookOpen, Search, Menu, LayoutDashboard, User, Bell, Shield, ShieldCheck, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MenuIcon } from "@/components/layout/menu-icon";
import type { MenuNode } from "@/lib/menu";

type Props = {
  isLoggedIn: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  handle?: string;
  menuItems: MenuNode[];
};

const PRIMARY = [
  { href: "/", label: "Início", icon: Home, exact: true },
  { href: "/consoles", label: "Consoles", icon: Gamepad2 },
  { href: "/guias", label: "Guias", icon: BookOpen },
  { href: "/buscar", label: "Buscar", icon: Search },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav({ isLoggedIn, isStaff, isAdmin, handle, menuItems }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Barra inferior fixa (thumb zone) — só no mobile */}
      <nav aria-label="Navegação principal (mobile)" className="mobile-bar sm:hidden">
        {PRIMARY.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link key={item.href} href={item.href} className="mobile-bar__item" aria-current={active ? "page" : undefined} data-active={active}>
              <item.icon className="size-5" aria-hidden="true" />
              <span className="mobile-bar__label">{item.label}</span>
            </Link>
          );
        })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button type="button" className="mobile-bar__item" aria-label="Abrir menu">
              <Menu className="size-5" aria-hidden="true" />
              <span className="mobile-bar__label">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] max-w-sm gap-0 p-0">
            <SheetHeader className="border-b border-border">
              <SheetTitle className="flex items-center gap-2">
                <Gamepad2 className="size-5 text-primary" aria-hidden="true" /> RetroWiki
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 overflow-y-auto p-3">
              <p className="mobile-menu__group">Navegar</p>
              {menuItems.map((item) => {
                if (item.children.length === 0 && item.href) {
                  const active = isActive(pathname, item.href);
                  return (
                    <SheetClose asChild key={item.id}>
                      <Link href={item.href} className="mobile-menu__link" data-active={active} aria-current={active ? "page" : undefined}>
                        <MenuIcon name={item.icon} className="size-4 text-muted-foreground" /> {item.label}
                      </Link>
                    </SheetClose>
                  );
                }
                return (
                  <div key={item.id} className="flex flex-col gap-1">
                    <p className="mobile-menu__group">{item.label}</p>
                    {item.children.map((c) => (
                      <SheetClose asChild key={c.id}>
                        <Link href={c.href ?? "#"} className="mobile-menu__link">
                          <MenuIcon name={c.icon} className="size-4 text-muted-foreground" /> {c.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                );
              })}

              <Separator className="my-2" />

              {isLoggedIn ? (
                <>
                  <p className="mobile-menu__group">Conta</p>
                  <SheetClose asChild><Link href="/painel" className="mobile-menu__link"><LayoutDashboard className="size-4 text-muted-foreground" aria-hidden="true" /> Painel</Link></SheetClose>
                  {handle && <SheetClose asChild><Link href={`/u/${handle}`} className="mobile-menu__link"><User className="size-4 text-muted-foreground" aria-hidden="true" /> Meu perfil</Link></SheetClose>}
                  <SheetClose asChild><Link href="/notificacoes" className="mobile-menu__link"><Bell className="size-4 text-muted-foreground" aria-hidden="true" /> Notificações</Link></SheetClose>
                  {isStaff && <SheetClose asChild><Link href="/moderacao" className="mobile-menu__link"><Shield className="size-4 text-muted-foreground" aria-hidden="true" /> Moderação</Link></SheetClose>}
                  {isAdmin && <SheetClose asChild><Link href="/admin" className="mobile-menu__link"><ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" /> Administração</Link></SheetClose>}
                  <SheetClose asChild>
                    <button type="button" className="mobile-menu__link text-destructive" onClick={() => signOut({ callbackUrl: "/" })}><LogOut className="size-4" aria-hidden="true" /> Sair</button>
                  </SheetClose>
                </>
              ) : (
                <div className="mt-1 flex flex-col gap-2 px-1">
                  <SheetClose asChild><Button asChild className="w-full"><Link href="/auth/cadastrar">Criar conta</Link></Button></SheetClose>
                  <SheetClose asChild><Button asChild variant="outline" className="w-full"><Link href="/auth/entrar">Entrar</Link></Button></SheetClose>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
