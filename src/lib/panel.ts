import "server-only";
import { eq, and, desc, count } from "drizzle-orm";
import { db } from "@/db";
import { comments, reviews, auditLog, users } from "@/db/schema";

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
};

export function auditLabel(action: string): string {
  return ACTION_LABEL[action] ?? action.replace(/_/g, " ");
}
