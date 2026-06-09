import "server-only";
import { getRolePermissions, type Role } from "@/lib/admin/role-permissions";

const STAFF = new Set(["moderator", "admin"]);

/** Pode publicar direto (sem fila de revisão)? Respeita requireApproval e
 * bypassReview do papel, além de staff/confiável. */
export async function canPublishDirectly(u: { role: string; trusted: boolean } | null): Promise<boolean> {
  if (!u) return false;
  const p = await getRolePermissions(u.role as Role);
  if (p.requireApproval) return false; // o papel força revisão
  if (STAFF.has(u.role) || u.trusted) return true;
  return Boolean(p.bypassReview);
}

/** Pode editar o próprio conteúdo, dentro da janela de tempo do papel?
 * Staff não tem limite. */
export async function canEditOwn(u: { role: string }, createdAt: Date | string): Promise<{ ok: boolean; error?: string }> {
  if (STAFF.has(u.role)) return { ok: true };
  const p = await getRolePermissions(u.role as Role);
  if (!p.canEditOwn) return { ok: false, error: "Seu papel não permite editar conteúdo." };
  const limit = Number(p.editTimeLimitMin) || 0;
  if (limit > 0) {
    const mins = (Date.now() - new Date(createdAt).getTime()) / 60000;
    if (mins > limit) return { ok: false, error: `O prazo para editar (${limit} min) expirou.` };
  }
  return { ok: true };
}

/** Pode excluir o próprio conteúdo? Staff sempre pode. */
export async function canDeleteOwn(u: { role: string }): Promise<boolean> {
  if (STAFF.has(u.role)) return true;
  const p = await getRolePermissions(u.role as Role);
  return Boolean(p.canDeleteOwn);
}

/** Máximo de reações (votos) por dia do papel (0 = ilimitado). */
export async function maxReactionsPerDay(role: string): Promise<number> {
  const p = await getRolePermissions(role as Role);
  return Number(p.maxReactionsPerDay) || 0;
}
