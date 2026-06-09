import Link from "next/link";
import { Pencil } from "lucide-react";
import { ROLES, ROLE_LABEL, DEFAULTS, getRoleCounts, getRolePermissions } from "@/lib/admin/role-permissions";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const counts = await getRoleCounts();
  const perms = await Promise.all(ROLES.map((r) => getRolePermissions(r)));

  return (
    <>
      <h1 className="page__title">Grupos e papéis</h1>
      <p className="page__note">Permissões de cada papel da comunidade.</p>

      <ul className="group-list">
        {ROLES.map((role, i) => {
          const color = String(perms[i].color ?? DEFAULTS[role].color);
          return (
            <li key={role} className="group-row">
              <span className="group-row__dot" style={{ backgroundColor: color }} aria-hidden="true" />
              <span className="group-row__name">{ROLE_LABEL[role]}</span>
              <span className="group-row__count">{counts[role] ?? 0} membro(s)</span>
              <Link href={`/admin/grupos/${role}`} className="group-row__edit" aria-label={`Editar ${ROLE_LABEL[role]}`}>
                <Pencil className="size-4" aria-hidden="true" /> Editar
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="muted mt-4">
        Os papéis são fixos (membro, colaborador, moderador, administrador). Criar novos grupos não se aplica ao nosso modelo.
      </p>
    </>
  );
}
