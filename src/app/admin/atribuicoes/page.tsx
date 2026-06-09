import { listAssignments, listTeams, getAssigneeOptions } from "@/lib/assignments";
import { getAssignmentSettings } from "@/lib/settings";
import { AssignmentsAdmin } from "@/components/admin/assignments-admin";

export const dynamic = "force-dynamic";

export default async function AssignmentsAdminPage() {
  const [assignments, teams, options, settings] = await Promise.all([listAssignments("open"), listTeams(), getAssigneeOptions(), getAssignmentSettings()]);
  return (
    <>
      <h1 className="page__title">Atribuições</h1>
      <p className="page__note">Atribua guias a moderadores ou equipes para acompanhamento.</p>
      <AssignmentsAdmin assignments={assignments} teams={teams} mods={options.users} settings={settings} />
    </>
  );
}
