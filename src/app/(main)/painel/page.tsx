import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PenLine, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getUserDrafts, typeLabel } from "@/lib/articles";
import { getCommentCount } from "@/lib/panel";
import { listNotifications } from "@/lib/notifications";
import { describeNotification } from "@/lib/notification-text";
import { getRankForReputation } from "@/lib/admin/ranks-db";
import { evaluateBadges, getUserBadges } from "@/lib/badges";
import { BadgeList } from "@/components/badges/badge-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Meu painel", robots: { index: false } };
export const dynamic = "force-dynamic";

const DRAFT_STATUS: Record<string, { label: string; mod: string }> = {
  draft: { label: "Rascunho", mod: "status--muted" },
  pending: { label: "Em revisão", mod: "status--warn" },
  changes_requested: { label: "Ajustes pedidos", mod: "status--warn" },
  published: { label: "Publicado", mod: "status--ok" },
  rejected: { label: "Rejeitado", mod: "status--bad" },
  archived: { label: "Arquivado", mod: "status--muted" },
};

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

export default async function PanelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/entrar");

  await evaluateBadges(user.id);
  const [articles, commentCount, notifications, userBadges] = await Promise.all([
    getUserDrafts(user.id),
    getCommentCount(user.id),
    listNotifications(user.id),
    getUserBadges(user.id),
  ]);

  const { getProfileCompletion } = await import("@/lib/profile-fields");
  const completion = await getProfileCompletion(user.id, Boolean(user.avatarUrl));

  const published = articles.filter((a) => a.status === "published").length;
  const drafts = articles.filter((a) =>
    ["draft", "pending", "changes_requested"].includes(a.status),
  ).length;
  const recent = articles.slice(0, 5);
  const recentNotifs = notifications.slice(0, 5);
  const rank = await getRankForReputation(user.reputation);

  return (
    <main id="main" className="page">
      <h1 className="page__title">Olá, {user.displayName}</h1>
      <p className="page__note">Seu resumo na comunidade.</p>

      {!completion.complete && (
        <aside className="profile-nudge mt-6" aria-label="Conclua seu perfil">
          <div className="min-w-0">
            <p className="profile-nudge__title">Conclua seu perfil</p>
            <p className="profile-nudge__text">
              {completion.needsAvatar && "Adicione um avatar"}
              {completion.needsAvatar && completion.missingFields > 0 && " e "}
              {completion.missingFields > 0 && `preencha ${completion.missingFields} campo(s) de perfil`}
              {" "}para a comunidade conhecer você.
            </p>
          </div>
          <Link href="/conta?secao=perfil" className="profile-nudge__cta">Completar agora</Link>
        </aside>
      )}

      <section aria-label="Rank" className="rank mt-6">
        <div className="rank__head">
          <span className="rank__label">{rank.label}</span>
          <span className="rank__index">Rank {rank.index} de {rank.total}</span>
        </div>
        <progress
          className="rank__progress"
          value={Math.round(rank.progress * 100)}
          max={100}
          aria-label={`Progresso no rank ${rank.label}`}
        />
        <p className="rank__next">
          {rank.next === null
            ? "Rank máximo alcançado."
            : `${rank.pointsToNext} ${rank.pointsToNext === 1 ? "ponto" : "pontos"} até o próximo rank.`}
        </p>
      </section>

      <dl className="stat-cards">
        <div className="stat-card">
          <dd className="stat-card__value">{drafts}</dd>
          <dt className="stat-card__label">Rascunhos</dt>
        </div>
        <div className="stat-card">
          <dd className="stat-card__value">{published}</dd>
          <dt className="stat-card__label">Publicados</dt>
        </div>
        <div className="stat-card">
          <dd className="stat-card__value">{commentCount}</dd>
          <dt className="stat-card__label">Comentários</dt>
        </div>
        <div className="stat-card">
          <dd className="stat-card__value">{user.reputation}</dd>
          <dt className="stat-card__label">Reputação</dt>
        </div>
      </dl>

      <section aria-labelledby="p-badges" className="panel-section mt-6">
        <div className="panel-section__head">
          <h2 id="p-badges" className="panel-section__title">Conquistas</h2>
        </div>
        <BadgeList items={userBadges} />
      </section>

      <div className="panel-grid">
        <section aria-labelledby="p-drafts" className="panel-section">
          <div className="panel-section__head">
            <h2 id="p-drafts" className="panel-section__title">Meu conteúdo</h2>
            <Link href="/estudio" className="panel-section__link">Ver tudo</Link>
          </div>
          {recent.length === 0 ? (
            <p className="empty__text">Você ainda não escreveu nada.</p>
          ) : (
            <ul className="link-list">
              {recent.map((a) => {
                const st = DRAFT_STATUS[a.status] ?? { label: a.status, mod: "status--muted" };
                const href = a.status === "published" ? `/guias/${a.slug}` : `/estudio/${a.id}`;
                return (
                  <li key={a.id}>
                    <Link href={href} className="link-card">
                      <span>
                        <span className="link-card__title">{a.title}</span>
                        <span className="link-card__meta">{typeLabel(a.type)}</span>
                      </span>
                      <span className={`status ${st.mod}`}>{st.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="p-notifs" className="panel-section">
          <div className="panel-section__head">
            <h2 id="p-notifs" className="panel-section__title">Notificações</h2>
            <Link href="/notificacoes" className="panel-section__link">Ver todas</Link>
          </div>
          {recentNotifs.length === 0 ? (
            <p className="empty__text">Nada por aqui ainda.</p>
          ) : (
            <ul className="notif-list">
              {recentNotifs.map((n) => {
                const d = describeNotification(n.type, n.payload);
                const inner = (
                  <div className={`notif ${n.readAt ? "notif--read" : "notif--unread"}`}>
                    <p className="notif__text">{d.text}</p>
                    <time className="notif__date" dateTime={new Date(n.createdAt).toISOString()}>{fmt(n.createdAt)}</time>
                  </div>
                );
                return <li key={n.id}>{d.href ? <Link href={d.href}>{inner}</Link> : inner}</li>;
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="btn-row mt-6">
        <Button asChild>
          <Link href="/estudio/novo"><PenLine className="size-4" aria-hidden="true" /> Escrever</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/u/${user.handle}`}><UserRound className="size-4" aria-hidden="true" /> Meu perfil</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/conta">Configurações</Link>
        </Button>
      </div>
    </main>
  );
}
