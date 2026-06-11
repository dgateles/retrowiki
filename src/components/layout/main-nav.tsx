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

/** Item rico do flyout: ícone (à esquerda) + título + descrição. */
function FlyoutItem({ href, icon: Icon, title, desc }: { href: string; icon: LucideIcon; title: string; desc: string }) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link href={href} className="group/fly flex flex-row items-start gap-3 rounded-lg p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 transition-colors group-hover/fly:border-primary/50 group-hover/fly:bg-primary/10">
            <Icon className="size-5 text-primary" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">{title}</span>
            <span className="block text-sm font-normal text-muted-foreground">{desc}</span>
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
            <div className="w-[440px] max-w-[90vw] p-2">
              <ul className="flex flex-col gap-0.5">
                {COMMUNITY.map((c) => <FlyoutItem key={c.href} {...c} />)}
              </ul>
              <div className="mt-2 grid grid-cols-2 gap-1 border-t border-border pt-2">
                <NavigationMenuLink asChild>
                  <Link href="/consoles/comparar" className="flex flex-row items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground">
                    <GitCompare className="size-4 text-foreground" aria-hidden="true" /> Comparar consoles
                  </Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link href="/estudio/novo" className="flex flex-row items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground">
                    <PenLine className="size-4 text-foreground" aria-hidden="true" /> Escrever guia
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
              <ul className="flex w-56 flex-col gap-0.5 p-2">
                {menuPages.map((p) => (
                  <li key={p.slug}>
                    <NavigationMenuLink asChild>
                      <Link href={`/p/${p.slug}`} className="flex flex-row items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground">
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
