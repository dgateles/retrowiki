import Link from "next/link";
import { Gamepad2, BookOpen, Users, Trophy, Shield, TrendingUp, Globe, Sparkles, Medal, Award, Target } from "lucide-react";
import { getAdminOverview, getRecentAudit, auditLabel, getGrowthSeries } from "@/lib/panel";
import { GrowthChart } from "@/components/admin/growth-chart";

export const dynamic = "force-dynamic";

const fmtRel = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

const CARDS = [
  { href: "/admin/consoles", icon: Gamepad2, title: "Consoles", desc: "Cadastrar e editar handhelds, specs, emulação e imagens." },
  { href: "/admin/membros", icon: Users, title: "Membros", desc: "Papéis, confiança e suspensões dos usuários." },
  { href: "/admin/grupos", icon: Shield, title: "Grupos", desc: "Permissões de cada papel da comunidade." },
  { href: "/admin/promocoes", icon: TrendingUp, title: "Promoções", desc: "Regras de auto-promoção de papel por critérios." },
  { href: "/admin/ip", icon: Globe, title: "Ferramentas de IP", desc: "Consulta forense por IP e por membro." },
  { href: "/admin/regras", icon: Sparkles, title: "Regras de conquista", desc: "Pontos e badges por ação (When/Then)." },
  { href: "/admin/ranks", icon: Medal, title: "Ranks", desc: "Níveis por reputação, editáveis." },
  { href: "/admin/badges", icon: Award, title: "Badges", desc: "Catálogo de conquistas (CRUD)." },
  { href: "/admin/quests", icon: Target, title: "Missões", desc: "Tarefas ligadas a regras com recompensa." },
  { href: "/admin/gamificacao", icon: Trophy, title: "Gamificação", desc: "Conceder badges e visão geral." },
  { href: "/moderacao", icon: BookOpen, title: "Moderação", desc: "Fila de revisão de guias e tutoriais da comunidade." },
];

export default async function AdminHome() {
  const [m, audit, growth] = await Promise.all([getAdminOverview(), getRecentAudit(6), getGrowthSeries(14)]);
  const metrics = [
    { label: "Membros", value: m.members, href: "/admin/membros" },
    { label: "Guias publicados", value: m.published, href: "/admin/artigos?status=published" },
    { label: "Em revisão", value: m.pendingReviews, href: "/moderacao" },
    { label: "Denúncias abertas", value: m.openReports, href: "/admin/denuncias" },
    { label: "Atribuições abertas", value: m.openAssignments, href: "/admin/atribuicoes" },
  ];

  return (
    <>
      <h1 className="page__title">Administração</h1>
      <p className="page__note">Gestão da plataforma.</p>

      <div className="admin-metrics mt-6">
        {metrics.map((s) => (
          <Link key={s.label} href={s.href} className="admin-metric">
            <span className="admin-metric__value">{s.value}</span>
            <span className="admin-metric__label">{s.label}</span>
          </Link>
        ))}
      </div>

      <GrowthChart data={growth} />

      {audit.length > 0 && (
        <section className="member-panel mt-6" aria-labelledby="adm-recent">
          <h2 id="adm-recent" className="member-panel__title">Atividade recente</h2>
          <ul className="warn-list mt-3">
            {audit.map((e) => (
              <li key={e.id} className="warn-list__item">
                <span className="min-w-0">
                  <span className="warn-list__reason">{e.actorHandle ? `@${e.actorHandle}` : "Sistema"} · {auditLabel(e.action)}</span>
                  <span className="warn-list__note">{e.target}</span>
                </span>
                <span className="muted shrink-0 text-xs">{fmtRel(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="admin-cards mt-6">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="admin-card">
            <c.icon className="size-6 text-primary" aria-hidden="true" />
            <h2 className="admin-card__title mt-2">{c.title}</h2>
            <p className="admin-card__desc">{c.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
