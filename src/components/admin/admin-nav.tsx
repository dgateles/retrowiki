"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Visão geral", exact: true },
  { href: "/admin/consoles", label: "Consoles", exact: false },
  { href: "/admin/membros", label: "Membros", exact: false },
  { href: "/admin/grupos", label: "Grupos", exact: false },
  { href: "/admin/gamificacao", label: "Gamificação", exact: false },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin__nav" aria-label="Administração">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn("admin__link", active && "admin__link--active")}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
