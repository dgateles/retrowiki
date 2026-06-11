"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Shield, TrendingUp, Globe, Lock,
  ScrollText, Medal, Award, Target, Sparkles, Settings2,
  IdCard, Heart, Bell, Ban, Gift,
  Flag, ShieldAlert, TriangleAlert, ClipboardList,
  ShieldCheck, Contact, FileText, Gamepad2, LayoutPanelLeft,
  Megaphone, Mail, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; icon: LucideIcon; exact?: boolean };
type NavGroup = { title?: string; links: NavLink[] };

// Navegação agrupada por seções, no estilo do AdminCP — ícone por item.
const GROUPS: NavGroup[] = [
  { links: [{ href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true }] },
  {
    title: "Membros",
    links: [
      { href: "/admin/membros", label: "Membros", icon: Users },
      { href: "/admin/grupos", label: "Grupos", icon: Shield },
      { href: "/admin/promocoes", label: "Promoções", icon: TrendingUp },
      { href: "/admin/ip", label: "Ferramentas de IP", icon: Globe },
      { href: "/admin/privacidade", label: "Privacidade (LGPD)", icon: Lock },
    ],
  },
  {
    title: "Conquistas",
    links: [
      { href: "/admin/regras", label: "Regras", icon: ScrollText },
      { href: "/admin/ranks", label: "Ranks", icon: Medal },
      { href: "/admin/badges", label: "Badges", icon: Award },
      { href: "/admin/quests", label: "Missões", icon: Target },
      { href: "/admin/gamificacao", label: "Gamificação", icon: Sparkles, exact: true },
      { href: "/admin/gamificacao/configuracoes", label: "Configurações", icon: Settings2 },
    ],
  },
  {
    title: "Config. de membros",
    links: [
      { href: "/admin/perfis", label: "Perfis", icon: IdCard },
      { href: "/admin/reputacao", label: "Reputação & Reações", icon: Heart },
      { href: "/admin/notificacoes", label: "Notificações", icon: Bell },
      { href: "/admin/banimentos", label: "Banimentos", icon: Ban },
      { href: "/admin/indicacoes", label: "Indicações", icon: Gift },
    ],
  },
  {
    title: "Moderação de conteúdo",
    links: [
      { href: "/admin/denuncias", label: "Denúncias", icon: Flag },
      { href: "/admin/spam", label: "Prevenção de spam", icon: ShieldAlert },
      { href: "/admin/avisos", label: "Avisos", icon: TriangleAlert },
      { href: "/admin/atribuicoes", label: "Atribuições", icon: ClipboardList },
    ],
  },
  {
    title: "Equipe",
    links: [
      { href: "/admin/moderadores", label: "Moderadores", icon: ShieldCheck },
      { href: "/admin/diretorio", label: "Diretório da equipe", icon: Contact },
    ],
  },
  {
    title: "Conteúdo",
    links: [
      { href: "/admin/artigos", label: "Artigos", icon: FileText },
      { href: "/admin/consoles", label: "Consoles", icon: Gamepad2 },
      { href: "/admin/paginas", label: "Páginas", icon: LayoutPanelLeft },
    ],
  },
  {
    title: "Comunicação",
    links: [
      { href: "/admin/anuncios", label: "Anúncios", icon: Megaphone },
      { href: "/admin/bulk-mail", label: "E-mail em massa", icon: Mail },
    ],
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
                <l.icon className="admin__link-icon" aria-hidden="true" />
                <span className="truncate">{l.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
