"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, Award, Settings2, ShieldAlert,
  ShieldCheck, FileText, Megaphone, ChevronDown, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; exact?: boolean };
type NavGroup = { title: string; icon: LucideIcon; items: NavItem[] };

const OVERVIEW = { href: "/admin", label: "Visão geral", icon: LayoutDashboard };

const GROUPS: NavGroup[] = [
  {
    title: "Membros", icon: Users, items: [
      { href: "/admin/membros", label: "Membros" },
      { href: "/admin/grupos", label: "Grupos" },
      { href: "/admin/promocoes", label: "Promoções" },
      { href: "/admin/ip", label: "Ferramentas de IP" },
      { href: "/admin/privacidade", label: "Privacidade (LGPD)" },
    ],
  },
  {
    title: "Conquistas", icon: Award, items: [
      { href: "/admin/regras", label: "Regras" },
      { href: "/admin/ranks", label: "Ranks" },
      { href: "/admin/badges", label: "Badges" },
      { href: "/admin/quests", label: "Missões" },
      { href: "/admin/gamificacao", label: "Gamificação", exact: true },
      { href: "/admin/gamificacao/configuracoes", label: "Configurações" },
    ],
  },
  {
    title: "Config. membros", icon: Settings2, items: [
      { href: "/admin/perfis", label: "Perfis" },
      { href: "/admin/reputacao", label: "Reputação & Reações" },
      { href: "/admin/notificacoes", label: "Notificações" },
      { href: "/admin/banimentos", label: "Banimentos" },
      { href: "/admin/indicacoes", label: "Indicações" },
    ],
  },
  {
    title: "Moderação", icon: ShieldAlert, items: [
      { href: "/admin/denuncias", label: "Denúncias" },
      { href: "/admin/spam", label: "Prevenção de spam" },
      { href: "/admin/avisos", label: "Avisos" },
      { href: "/admin/atribuicoes", label: "Atribuições" },
    ],
  },
  {
    title: "Equipe", icon: ShieldCheck, items: [
      { href: "/admin/moderadores", label: "Moderadores" },
      { href: "/admin/diretorio", label: "Diretório da equipe" },
    ],
  },
  {
    title: "Conteúdo", icon: FileText, items: [
      { href: "/admin/artigos", label: "Artigos" },
      { href: "/admin/consoles", label: "Consoles" },
      { href: "/admin/paginas", label: "Páginas" },
      { href: "/admin/menus", label: "Menus" },
    ],
  },
  {
    title: "Comunicação", icon: Megaphone, items: [
      { href: "/admin/anuncios", label: "Anúncios" },
      { href: "/admin/bulk-mail", label: "E-mail em massa" },
    ],
  },
];

function itemActive(pathname: string, it: NavItem) {
  return it.exact ? pathname === it.href : pathname.startsWith(it.href);
}

export function AdminNav() {
  const pathname = usePathname();
  const activeGroup = GROUPS.find((g) => g.items.some((it) => itemActive(pathname, it)))?.title ?? null;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const isOpen = (t: string) => open[t] ?? t === activeGroup;

  return (
    <nav className="admin__nav" aria-label="Administração">
      <Link
        href={OVERVIEW.href}
        aria-current={pathname === OVERVIEW.href ? "page" : undefined}
        className={cn("admin__link", pathname === OVERVIEW.href && "admin__link--active")}
      >
        <OVERVIEW.icon className="admin__link-icon" aria-hidden="true" />
        <span className="truncate">{OVERVIEW.label}</span>
      </Link>

      {GROUPS.map((g) => {
        const opened = isOpen(g.title);
        const hasActive = g.title === activeGroup;
        const panelId = `adm-${g.title.replace(/\W+/g, "-")}`;
        return (
          <div key={g.title} className="admin__group">
            <button
              type="button"
              aria-expanded={opened}
              aria-controls={panelId}
              onClick={() => setOpen((o) => ({ ...o, [g.title]: !opened }))}
              className={cn("admin__link admin__group-btn", hasActive && "text-foreground")}
            >
              <g.icon className="admin__link-icon" aria-hidden="true" />
              <span className="flex-1 truncate text-left">{g.title}</span>
              <ChevronDown className={cn("admin__chevron", !opened && "-rotate-90")} aria-hidden="true" />
            </button>
            {opened && (
              <div id={panelId} className="admin__sub">
                {g.items.map((it) => {
                  const active = itemActive(pathname, it);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      aria-current={active ? "page" : undefined}
                      className={cn("admin__sublink", active && "admin__sublink--active")}
                    >
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
