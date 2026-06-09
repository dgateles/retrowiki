"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { isRole, saveRolePermissions, type Permissions } from "@/lib/admin/role-permissions";

type Result = { ok: boolean; error?: string };

export async function setRolePermissionsAction(role: string, body: string): Promise<Result> {
  let actor;
  try {
    actor = await requireRole("admin");
  } catch {
    return { ok: false, error: "Acesso restrito." };
  }
  if (!isRole(role)) return { ok: false, error: "Papel inválido." };

  let perms: Permissions;
  try {
    perms = JSON.parse(body) as Permissions;
  } catch {
    return { ok: false, error: "Dados inválidos." };
  }

  try {
    await saveRolePermissions(role, perms);
    await db.insert(auditLog).values({ actorId: Number(actor.id), action: "role_permissions_update", target: `role:${role}` });
    revalidatePath("/admin/grupos");
    revalidatePath(`/admin/grupos/${role}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}
