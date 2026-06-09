import Link from "next/link";
import { Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-helpers";
import { listMembers } from "@/lib/admin/members";
import { roleLabel, rankForTiers } from "@/lib/ranks";
import { getRankTierList } from "@/lib/admin/ranks-db";
import { Pager } from "@/components/ui/pager";
import { MemberRowActions } from "@/components/admin/member-row-actions";

export const dynamic = "force-dynamic";

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? p[0]?.[1] ?? "")).toUpperCase();
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q ?? "";
  const me = await getCurrentUser();
  const { items, hasMore } = await listMembers({ page, q });
  const tiers = await getRankTierList();

  return (
    <>
      <h1 className="page__title">Membros</h1>
      <p className="page__note">Gerencie papéis, confiança e suspensões.</p>

      <form method="get" role="search" className="search mt-6">
        <Search className="search__icon" aria-hidden="true" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, usuário ou e-mail…"
          aria-label="Buscar membros"
          className="search__input"
        />
      </form>

      {items.length === 0 ? (
        <p className="empty mt-6">Nenhum membro encontrado.</p>
      ) : (
        <ul className="member-list">
          {items.map((m) => {
            const rank = rankForTiers(m.reputation, tiers);
            return (
              <li
                key={m.id}
                className={`member-card${m.isSuspended ? " member-card--suspended" : ""}`}
              >
                <div className="member-card__id">
                  <span className="member-card__avatar" aria-hidden="true">{initials(m.displayName)}</span>
                  <div className="min-w-0">
                    <Link href={`/admin/membros/${m.id}`} className="member-card__name member-card__name--link">{m.displayName}</Link>
                    <p className="member-card__meta">
                      @{m.handle} · {m.email} · {roleLabel(m.role)} · {rank.label} ({m.reputation})
                    </p>
                  </div>
                </div>
                <MemberRowActions
                  userId={m.id}
                  role={m.role}
                  trusted={m.trusted}
                  suspended={m.isSuspended}
                  isSelf={Number(me?.id) === m.id}
                />
              </li>
            );
          })}
        </ul>
      )}

      <Pager path="/admin/membros" page={page} hasMore={hasMore} params={{ q }} />
    </>
  );
}
