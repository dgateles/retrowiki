"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { MenuIcon } from "@/components/layout/menu-icon";
import type { MenuNode, MenuChild } from "@/lib/menu";

/** Item rico do flyout: ícone (à esquerda) + título + descrição. */
function FlyoutItem({ item }: { item: MenuChild }) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link href={item.href ?? "#"} className="group/fly flex flex-row items-start gap-3 rounded-lg p-3">
          {item.icon && (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 transition-colors group-hover/fly:border-primary/50 group-hover/fly:bg-primary/10">
              <MenuIcon name={item.icon} className="size-5 text-primary" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">{item.label}</span>
            {item.description && <span className="block text-sm font-normal text-muted-foreground">{item.description}</span>}
          </span>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export function MainNav({ items }: { items: MenuNode[] }) {
  return (
    <NavigationMenu className="site-header__nav" aria-label="Principal">
      <NavigationMenuList>
        {items.map((item) => {
          // Link simples (ou flyout/dropdown sem filhos com href).
          if (item.type === "link" || item.children.length === 0) {
            if (!item.href) return null;
            return (
              <NavigationMenuItem key={item.id}>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href={item.href}>{item.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          }

          if (item.type === "flyout") {
            return (
              <NavigationMenuItem key={item.id}>
                <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="flex w-[440px] max-w-[90vw] flex-col gap-0.5 p-2">
                    {item.children.map((c) => <FlyoutItem key={c.id} item={c} />)}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }

          // dropdown
          return (
            <NavigationMenuItem key={item.id}>
              <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="flex w-56 flex-col gap-0.5 p-2">
                  {item.children.map((c) => (
                    <li key={c.id}>
                      <NavigationMenuLink asChild>
                        <Link href={c.href ?? "#"} className="flex flex-row items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground">
                          <MenuIcon name={c.icon} className="size-4 text-muted-foreground" />
                          {c.label}
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
