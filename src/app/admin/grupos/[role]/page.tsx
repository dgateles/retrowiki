import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isRole, getRolePermissions, ROLE_LABEL, PERM_FIELDS } from "@/lib/admin/role-permissions";
import { RolePermForm } from "@/components/admin/role-perm-form";

export const dynamic = "force-dynamic";

export default async function GroupEditPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (!isRole(role)) notFound();
  const perms = await getRolePermissions(role);

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/grupos">
          <ChevronLeft className="size-4" aria-hidden="true" /> Grupos
        </Link>
      </Button>

      <h1 className="page__title mt-3">{ROLE_LABEL[role]}</h1>
      <p className="page__note">Permissões deste papel.</p>

      <RolePermForm role={role} fields={PERM_FIELDS} initial={perms} />
    </>
  );
}
