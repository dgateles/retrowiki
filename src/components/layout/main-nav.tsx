"use client";

import Link from "next/link";
import { Trophy, Target, Users, GitCompare, PenLine, FileText, type LucideIcon } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

type MenuPage = { slug: string; title: string };

const COMMUNITY: { href: string; icon: LucideIcon; title: string; desc: string }[] = [
  { href: "/leaderboard", icon: Trophy, title: "Leaderboard", desc: "Ranking de membros e guias em alta" },
  { href: "/missoes", icon: Target, title: "Missões", desc: "Complete tarefas e ganhe conquistas" },
  { href: "/equipe", icon: Users, title: "Equipe", desc: "Quem mantém a RetroWiki" },
];

const LINKS = [
  { href: "/consoles", label: "Consoles" },
  { href: "/guias", label: "Guias" },
  { href: "/blog", label: "Blog" },
];

/** Item rico do flyout (ícone em quadro + título + descrição). */
function FlyoutItem({ href, icon: Icon, title, desc }: { href: string; icon: LucideIcon; title: string; desc: string }) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link href={href} className="flyout__item">
          <span className="flyout__icon" aria-hidden="true"><Icon className="size-5" /></span>
          <span className="min-w-0">
            <span className="flyout__title">{title}</span>
            <span className="flyout__desc">{desc}</span>
          </span>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export function MainNav({ menuPages }: { menuPages: MenuPage[] }) {
  return (
    <NavigationMenu className="site-header__nav" aria-label="Principal">
      <NavigationMenuList>
        {LINKS.map((l) => (
          <NavigationMenuItem key={l.href}>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href={l.href}>{l.label}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}

        {/* Flyout (mega-menu) */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>Comunidade</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="flyout">
              <ul className="flyout__list">
                {COMMUNITY.map((c) => <FlyoutItem key={c.href} {...c} />)}
              </ul>
              <div className="flyout__foot">
                <NavigationMenuLink asChild>
                  <Link href="/consoles/comparar" className="flyout__action">
                    <GitCompare className="size-4" aria-hidden="true" /> Comparar consoles
                  </Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link href="/estudio/novo" className="flyout__action">
                    <PenLine className="size-4" aria-hidden="true" /> Escrever guia
                  </Link>
                </NavigationMenuLink>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Dropdown simples (páginas) */}
        {menuPages.length > 0 && (
          <NavigationMenuItem>
            <NavigationMenuTrigger>Mais</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="dropdown-menu-nav">
                {menuPages.map((p) => (
                  <li key={p.slug}>
                    <NavigationMenuLink asChild>
                      <Link href={`/p/${p.slug}`} className="dropdown-menu-nav__link">
                        <FileText className="size-4 text-muted-foreground" aria-hidden="true" /> {p.title}
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
