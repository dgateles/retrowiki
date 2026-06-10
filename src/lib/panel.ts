import "server-only";
import { eq, and, desc, count, lt } from "drizzle-orm";
import { db } from "@/db";
import { comments, reviews, auditLog, users } from "@/db/schema";

/** Registra uma ação no log de moderação capturando o IP do autor. */
export async function logModAction(actorId: number, action: string, target: string, meta?: unknown): Promise<void> {
  try {
    const { getClientIp } = await import("@/lib/ip");
    await db.insert(auditLog).values({ actorId, action, target, ip: await getClientIp(), meta: meta ?? null });
  } catch {
    // best-effort
  }
}

/** Remove entradas do log de moderação mais antigas que N dias (0 = nunca). */
export async function pruneAuditLog(days: number): Promise<void> {
  if (!days || days <= 0) return;
  try {
    await db.delete(auditLog).where(lt(auditLog.createdAt, new Date(Date.now() - days * 86400_000)));
  } catch {
    // best-effort
  }
}

/** Quantos comentários visíveis o usuário publicou. */
export async function getCommentCount(userId: number): Promise<number> {
  try {
    const [r] = await db
      .select({ n: count() })
      .from(comments)
      .where(and(eq(comments.authorId, userId), eq(comments.status, "visible")));
    return r?.n ?? 0;
  } catch {
    return 0;
  }
}

/** Total de revisões pendentes na fila de moderação. */
export async function getPendingReviewCount(): Promise<number> {
  try {
    const [r] = await db.select({ n: count() }).from(reviews).where(eq(reviews.decision, "pending"));
    return r?.n ?? 0;
  } catch {
    return 0;
  }
}

export type AuditEntry = {
  id: number;
  action: string;
  target: string;
  createdAt: Date;
  actorHandle: string | null;
};

/** Ações recentes registradas no log de auditoria. */
export async function getRecentAudit(limit = 8): Promise<AuditEntry[]> {
  try {
    return await db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        target: auditLog.target,
        createdAt: auditLog.createdAt,
        actorHandle: users.handle,
      })
      .from(auditLog)
      .leftJoin(users, eq(users.id, auditLog.actorId))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);
  } catch {
    return [];
  }
}

const ACTION_LABEL: Record<string, string> = {
  moderate_approved: "aprovou um guia",
  moderate_changes_requested: "pediu ajustes em um guia",
  moderate_rejected: "rejeitou um guia",
  device_create: "cadastrou um console",
  device_update: "editou um console",
  hide_comment: "ocultou um comentário",
  warn_member: "advertiu um membro",
  flag_spammer: "marcou como spammer",
  assign_content: "atribuiu um guia",
  report_completed: "removeu conteúdo denunciado",
  report_rejected: "arquivou uma denúncia",
  ban_filter_create: "criou um filtro de ban",
  ban_filter_delete: "removeu um filtro de ban",
  user_create: "criou um membro",
  user_force_reset: "forçou troca de senha",
  members_import: "importou membros",
  notif_prefs_reset: "redefiniu preferências de notificação",
  user_set_role: "alterou o papel de um membro",
  user_set_reputation: "ajustou a reputação de um membro",
  auto_promotion: "promoveu um membro (automático)",
  deletion_completed: "anonimizou uma conta (LGPD)",
  deletion_rejected: "recusou um pedido de exclusão",
  bulk_mail_sent: "enviou e-mail em massa",
};

export function auditLabel(action: string): string {
  return ACTION_LABEL[action] ?? action.replace(/_/g, " ");
}

export type ModLogEntry = { id: number; action: string; target: string; ip: string | null; createdAt: Date; actorName: string | null; actorHandle: string | null };

/** Log de moderação paginado (audit_log com o nome do autor). */
export async function getModeratorLog(page = 1, pageSize = 30): Promise<{ items: ModLogEntry[]; hasMore: boolean }> {
  try {
    const offset = Math.max(0, (page - 1) * pageSize);
    const rows = await db
      .select({ id: auditLog.id, action: auditLog.action, target: auditLog.target, ip: auditLog.ip, createdAt: auditLog.createdAt, actorName: users.displayName, actorHandle: users.handle })
      .from(auditLog)
      .leftJoin(users, eq(users.id, auditLog.actorId))
      .orderBy(desc(auditLog.createdAt))
      .limit(pageSize + 1)
      .offset(offset);
    return { items: rows.slice(0, pageSize), hasMore: rows.length > pageSize };
  } catch {
    return { items: [], hasMore: false };
  }
}

/** Contagem de membros por papel de staff. */
export async function getStaffCounts(): Promise<{ moderators: number; admins: number }> {
  try {
    const [m] = await db.select({ n: count() }).from(users).where(eq(users.role, "moderator"));
    const [a] = await db.select({ n: count() }).from(users).where(eq(users.role, "admin"));
    return { moderators: m?.n ?? 0, admins: a?.n ?? 0 };
  } catch {
    return { moderators: 0, admins: 0 };
  }
}
