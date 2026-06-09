import "server-only";
import { and, count, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users, articles, comments, auditLog } from "@/db/schema";

export type MemberDetail = {
  id: number;
  handle: string;
  displayName: string;
  email: string;
  role: "member" | "contributor" | "moderator" | "admin";
  reputation: number;
  trusted: boolean;
  isSuspended: boolean;
  avatarUrl: string | null;
  createdAt: Date;
  guides: number;
  comments: number;
};

export type AuditEntry = { id: number; action: string; meta: unknown; createdAt: Date; isActor: boolean };

export async function getMemberDetail(id: number): Promise<MemberDetail | null> {
  try {
    const [u] = await db
      .select({
        id: users.id,
        handle: users.handle,
        displayName: users.displayName,
        email: users.email,
        role: users.role,
        reputation: users.reputation,
        trusted: users.trusted,
        isSuspended: users.isSuspended,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!u) return null;

    const [g] = await db
      .select({ n: count() })
      .from(articles)
      .where(and(eq(articles.authorId, id), eq(articles.status, "published")));
    const [c] = await db
      .select({ n: count() })
      .from(comments)
      .where(and(eq(comments.authorId, id), eq(comments.status, "visible")));

    return { ...u, guides: g?.n ?? 0, comments: c?.n ?? 0 };
  } catch {
    return null;
  }
}

/** Atividade de auditoria que envolve o usuário (ações sobre ele e feitas por ele). */
export async function getMemberAudit(id: number): Promise<AuditEntry[]> {
  try {
    const rows = await db
      .select({ id: auditLog.id, action: auditLog.action, meta: auditLog.meta, createdAt: auditLog.createdAt, actorId: auditLog.actorId })
      .from(auditLog)
      .where(or(eq(auditLog.target, `user:${id}`), eq(auditLog.actorId, id)))
      .orderBy(desc(auditLog.id))
      .limit(20);
    return rows.map((r) => ({ id: r.id, action: r.action, meta: r.meta, createdAt: r.createdAt, isActor: r.actorId === id }));
  } catch {
    return [];
  }
}
