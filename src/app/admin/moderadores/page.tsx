import Link from "next/link";
import { getStaffCounts, getModeratorLog, auditLabel } from "@/lib/panel";
import { getStaffSettings } from "@/lib/settings";
import { getStaffLogins } from "@/lib/ip";
import { roleLabel } from "@/lib/ranks";
import { StaffSettingsForm } from "@/components/admin/staff-settings-form";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/ui/pager";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

export default async function ModeratorsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const [counts, settings, log, logins] = await Promise.all([getStaffCounts(), getStaffSettings(), getModeratorLog(page), getStaffLogins()]);

  return (
    <>
      <h1 className="page__title">Moderadores</h1>
      <p className="page__note">A equipe e o registro das ações de moderação. As permissões por papel ficam em Grupos.</p>

      <section className="member-panel mt-6">
        <div className="page__head">
          <h2 className="member-panel__title">Equipe</h2>
          <Button asChild size="sm" variant="outline"><Link href="/admin/grupos">Gerenciar permissões</Link></Button>
        </div>
        <ul className="staff-groups mt-3">
          <li className="staff-groups__row">
            <span className="staff-groups__name">Administradores <span className="muted font-normal">· {counts.admins} membro(s)</span></span>
            <Link href="/admin/membros?role=admin" className="link-inline text-sm">Mostrar administradores</Link>
          </li>
          <li className="staff-groups__row">
            <span className="staff-groups__name">Moderadores <span className="muted font-normal">· {counts.moderators} membro(s)</span></span>
            <Link href="/admin/membros?role=moderator" className="link-inline text-sm">Mostrar moderadores</Link>
          </li>
        </ul>
        <p className="muted mt-2 text-xs">Para adicionar um membro à equipe, defina o papel dele em Membros. As permissões por papel ficam em Grupos.</p>
      </section>

      <section className="member-panel mt-6">
        <h2 className="member-panel__title">Logins recentes da equipe</h2>
        {logins.length === 0 ? (
          <p className="muted mt-3">Nenhum login registrado.</p>
        ) : (
          <div className="modlog mt-3">
            <div className="modlog__head">
              <span>Membro</span><span>Papel</span><span>IP</span><span>Último acesso</span>
            </div>
            {logins.map((l, i) => (
              <div key={`${l.handle}-${l.ip}-${i}`} className="modlog__row">
                <span className="truncate"><Link href={`/u/${l.handle}`} className="link-inline">{l.displayName}</Link></span>
                <span className="truncate">{roleLabel(l.role)}</span>
                <span className="modlog__target truncate">{l.ip}</span>
                <span className="muted">{fmt(l.lastUsedAt)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="muted mt-2 text-xs">Acessos bem-sucedidos por IP (registro de IPs). Tentativas malsucedidas não são registradas.</p>
      </section>

      <section className="member-panel mt-6">
        <h2 className="member-panel__title">Configurações</h2>
        <div className="mt-3"><StaffSettingsForm initial={settings} /></div>
      </section>

      <section className="member-panel mt-6">
        <h2 className="member-panel__title">Log de moderação</h2>
        {log.items.length === 0 ? (
          <p className="muted mt-3">Nenhuma ação registrada.</p>
        ) : (
          <div className="modlog modlog--5 mt-3">
            <div className="modlog__head">
              <span>Membro</span><span>Ação</span><span>Alvo</span><span>IP</span><span>Data</span>
            </div>
            {log.items.map((e) => (
              <div key={e.id} className="modlog__row">
                <span className="truncate">{e.actorName ? <Link href={`/u/${e.actorHandle}`} className="link-inline">{e.actorName}</Link> : "—"}</span>
                <span className="truncate">{auditLabel(e.action)}</span>
                <span className="modlog__target truncate">{e.target}</span>
                <span className="modlog__target truncate">{e.ip ?? "—"}</span>
                <span className="muted">{fmt(e.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
        <Pager path="/admin/moderadores" page={page} hasMore={log.hasMore} />
      </section>
    </>
  );
}
