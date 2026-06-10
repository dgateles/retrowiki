"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; exact?: boolean };
type NavGroup = { title?: string; links: NavLink[] };

// Navegação agrupada por seções, no estilo do AdminCP.
const GROUPS: NavGroup[] = [
  { links: [{ href: "/admin", label: "Visão geral", exact: true }] },
  {
    title: "Membros",
    links: [
      { href: "/admin/membros", label: "Membros" },
      { href: "/admin/grupos", label: "Grupos" },
      { href: "/admin/promocoes", label: "Promoções" },
      { href: "/admin/ip", label: "Ferramentas de IP" },
      { href: "/admin/privacidade", label: "Privacidade (LGPD)" },
    ],
  },
  {
    title: "Conquistas",
    links: [
      { href: "/admin/regras", label: "Regras" },
      { href: "/admin/ranks", label: "Ranks" },
      { href: "/admin/badges", label: "Badges" },
      { href: "/admin/quests", label: "Missões" },
      { href: "/admin/gamificacao", label: "Gamificação", exact: true },
      { href: "/admin/gamificacao/configuracoes", label: "Configurações" },
    ],
  },
  {
    title: "Config. de membros",
    links: [
      { href: "/admin/perfis", label: "Perfis" },
      { href: "/admin/reputacao", label: "Reputação & Reações" },
      { href: "/admin/notificacoes", label: "Notificações" },
      { href: "/admin/banimentos", label: "Banimentos" },
      { href: "/admin/indicacoes", label: "Indicações" },
    ],
  },
  {
    title: "Moderação de conteúdo",
    links: [
      { href: "/admin/denuncias", label: "Denúncias" },
      { href: "/admin/spam", label: "Prevenção de spam" },
      { href: "/admin/avisos", label: "Avisos" },
      { href: "/admin/atribuicoes", label: "Atribuições" },
    ],
  },
  {
    title: "Equipe",
    links: [
      { href: "/admin/moderadores", label: "Moderadores" },
      { href: "/admin/diretorio", label: "Diretório da equipe" },
    ],
  },
  {
    title: "Conteúdo",
    links: [{ href: "/admin/consoles", label: "Consoles" }],
  },
  {
    title: "Comunicação",
    links: [{ href: "/admin/bulk-mail", label: "E-mail em massa" }],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin__nav" aria-label="Administração">
      {GROUPS.map((group, gi) => (
        <div key={group.title ?? `g${gi}`} className="admin__group">
          {group.title && <p className="admin__group-title">{group.title}</p>}
          {group.links.map((l) => {
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
        </div>
      ))}
    </nav>
  );
}
