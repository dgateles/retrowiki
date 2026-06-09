import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Award } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getMemberDetail, getMemberAudit } from "@/lib/admin/member-detail";
import { getUserBadges } from "@/lib/badges";
import { rankForReputation, roleLabel } from "@/lib/ranks";
import { Button } from "@/components/ui/button";
import { MemberManage } from "@/components/admin/member-manage";

export const dynamic = "force-dynamic";

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? p[0]?.[1] ?? "")).toUpperCase();
}

const AUDIT_LABEL: Record<string, string> = {
  user_set_role: "Papel alterado",
  user_suspend: "Conta suspensa",
  user_unsuspend: "Conta reativada",
  user_trust: "Marcado como confiável",
  user_untrust: "Confiança removida",
  user_set_reputation: "Reputação ajustada",
  badge_award: "Badge concedida",
  badge_revoke: "Badge removida",
  hide_comment: "Comentário ocultado",
  delete_comment: "Comentário excluído",
};

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId) || memberId <= 0) notFound();

  const [me, member] = await Promise.all([getCurrentUser(), getMemberDetail(memberId)]);
  if (!member) notFound();
  const [badges, audit] = await Promise.all([getUserBadges(memberId), getMemberAudit(memberId)]);
  const rank = rankForReputation(member.reputation);
  const isSelf = Number(me?.id) === memberId;
  const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/membros">
          <ChevronLeft className="size-4" aria-hidden="true" /> Membros
        </Link>
      </Button>

      <div className="member-head mt-3">
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatarUrl} alt="" className="member-head__avatar member-head__avatar--img" />
        ) : (
          <span className="member-head__avatar" aria-hidden="true">{initials(member.displayName)}</span>
        )}
        <div className="min-w-0">
          <h1 className="member-head__name">{member.displayName}</h1>
          <p className="member-head__meta">
            @{member.handle} · {member.email} · {roleLabel(member.role)}
            {member.isSuspended && <span className="member-head__susp"> · suspenso</span>}
          </p>
          <p className="member-head__meta">Entrou em {fmt(member.createdAt)}</p>
        </div>
      </div>

      <div className="member-grid">
        <section className="member-panel">
          <h2 className="member-panel__title">Gestão</h2>
          <MemberManage
            userId={member.id}
            role={member.role}
            trusted={member.trusted}
            suspended={member.isSuspended}
            reputation={member.reputation}
            isSelf={isSelf}
          />
        </section>

        <section className="member-panel">
          <h2 className="member-panel__title">Estatísticas</h2>
          <dl className="member-stats">
            <div className="member-stats__item"><dt className="member-stats__k">Rank</dt><dd className="member-stats__v">{rank.label} ({rank.index}/{rank.total})</dd></div>
            <div className="member-stats__item"><dt className="member-stats__k">Reputação</dt><dd className="member-stats__v">{member.reputation} pts</dd></div>
            <div className="member-stats__item"><dt className="member-stats__k">Guias publicados</dt><dd className="member-stats__v">{member.guides}</dd></div>
            <div className="member-stats__item"><dt className="member-stats__k">Comentários</dt><dd className="member-stats__v">{member.comments}</dd></div>
          </dl>
          <div className="member-progress" aria-hidden="true">
            <div className="member-progress__bar" style={{ width: `${Math.round(rank.progress * 100)}%` }} />
          </div>
          <p className="muted mt-1">
            {rank.pointsToNext > 0 ? `${rank.pointsToNext} pts para o próximo rank` : "Rank máximo"}
          </p>
        </section>

        <section className="member-panel">
          <h2 className="member-panel__title">Conquistas ({badges.length})</h2>
          {badges.length === 0 ? (
            <p className="muted">Nenhuma badge ainda.</p>
          ) : (
            <ul className="member-badges">
              {badges.map((b) => (
                <li key={b.slug} className={`member-badge member-badge--${b.tier}`}>
                  <Award className="size-4" aria-hidden="true" /> {b.name}
                </li>
              ))}
            </ul>
          )}
          <p className="muted mt-2">
            <Link href="/admin/gamificacao" className="link-inline">Conceder ou remover</Link> na Gamificação.
          </p>
        </section>

        <section className="member-panel member-panel--wide">
          <h2 className="member-panel__title">Atividade recente</h2>
          {audit.length === 0 ? (
            <p className="muted">Sem registros.</p>
          ) : (
            <ul className="member-audit">
              {audit.map((a) => (
                <li key={a.id} className="member-audit__row">
                  <span>{AUDIT_LABEL[a.action] ?? a.action}{a.isActor ? " (por ele)" : ""}</span>
                  <time className="muted">{fmt(a.createdAt)}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
