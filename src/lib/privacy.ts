import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  articles,
  comments,
  memberIps,
  userWarnings,
  profileFieldValues,
  profileFields,
  privacyRequests,
} from "@/db/schema";

// ── Exportação de dados (direito de acesso) ────────────────────────────────

export async function exportUserData(userId: number): Promise<Record<string, unknown> | null> {
  try {
    const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!u) return null;

    const [arts, cms, ips, warns, fieldVals] = await Promise.all([
      db.select({ id: articles.id, title: articles.title, status: articles.status, createdAt: articles.createdAt }).from(articles).where(eq(articles.authorId, userId)),
      db.select({ id: comments.id, articleId: comments.articleId, createdAt: comments.createdAt }).from(comments).where(eq(comments.authorId, userId)),
      db.select({ ip: memberIps.ip, firstUsedAt: memberIps.firstUsedAt, lastUsedAt: memberIps.lastUsedAt, uses: memberIps.uses }).from(memberIps).where(eq(memberIps.userId, userId)),
      db.select({ reason: userWarnings.reasonName, points: userWarnings.points, createdAt: userWarnings.createdAt }).from(userWarnings).where(eq(userWarnings.userId, userId)),
      db.select({ campo: profileFields.name, value: profileFieldValues.value }).from(profileFieldValues).innerJoin(profileFields, eq(profileFields.id, profileFieldValues.fieldId)).where(eq(profileFieldValues.userId, userId)),
    ]);

    return {
      geradoEm: new Date().toISOString(),
      conta: {
        id: u.id,
        nome: u.displayName,
        usuario: u.handle,
        email: u.email,
        papel: u.role,
        reputacao: u.reputation,
        membroDesde: u.createdAt,
      },
      camposDePerfil: fieldVals,
      guias: arts,
      comentarios: cms,
      enderecosIp: ips,
      advertencias: warns,
    };
  } catch {
    return null;
  }
}

// ── Pedidos de exclusão ────────────────────────────────────────────────────

export type DeletionRequest = { id: number; userId: number; userName: string; userHandle: string; reason: string; status: string; createdAt: Date };

export async function hasOpenDeletionRequest(userId: number): Promise<boolean> {
  try {
    const [row] = await db.select({ id: privacyRequests.id }).from(privacyRequests).where(and(eq(privacyRequests.userId, userId), eq(privacyRequests.status, "open"))).limit(1);
    return Boolean(row);
  } catch {
    return false;
  }
}

export async function createDeletionRequest(userId: number, reason: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (await hasOpenDeletionRequest(userId)) return { ok: false, error: "Você já tem um pedido em aberto." };
    await db.insert(privacyRequests).values({ userId, type: "deletion", reason: reason.slice(0, 500), status: "open" });
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao registrar o pedido." };
  }
}

export async function listDeletionRequests(status: "open" | "completed" | "rejected" = "open"): Promise<DeletionRequest[]> {
  try {
    const rows = await db
      .select({ id: privacyRequests.id, userId: privacyRequests.userId, reason: privacyRequests.reason, status: privacyRequests.status, createdAt: privacyRequests.createdAt, userName: users.displayName, userHandle: users.handle })
      .from(privacyRequests)
      .leftJoin(users, eq(users.id, privacyRequests.userId))
      .where(eq(privacyRequests.status, status))
      .orderBy(desc(privacyRequests.createdAt));
    return rows.map((r) => ({ id: r.id, userId: r.userId, userName: r.userName ?? "—", userHandle: r.userHandle ?? "", reason: r.reason, status: r.status, createdAt: r.createdAt }));
  } catch {
    return [];
  }
}

export async function getOpenDeletionCount(): Promise<number> {
  try {
    const rows = await db.select({ id: privacyRequests.id }).from(privacyRequests).where(eq(privacyRequests.status, "open"));
    return rows.length;
  } catch {
    return 0;
  }
}

/** Anonimiza a conta (LGPD): remove dados pessoais, mantém o conteúdo atribuído. */
export async function anonymizeUser(userId: number): Promise<void> {
  const tag = userId.toString(36);
  await db.update(users).set({
    displayName: "Usuário removido",
    handle: `removido_${tag}`,
    email: `removido+${tag}@retrowiki.invalid`,
    passwordHash: "",
    avatarUrl: null,
    coverUrl: null,
    isSuspended: true,
    deletedAt: new Date(),
  }).where(eq(users.id, userId));
  await db.delete(profileFieldValues).where(eq(profileFieldValues.userId, userId));
  await db.delete(memberIps).where(eq(memberIps.userId, userId));
}

export async function resolveDeletionRequest(id: number, decision: "completed" | "rejected", modId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const [req] = await db.select().from(privacyRequests).where(eq(privacyRequests.id, id)).limit(1);
    if (!req || req.status !== "open") return { ok: false, error: "Pedido inválido." };
    if (decision === "completed") await anonymizeUser(req.userId);
    await db.update(privacyRequests).set({ status: decision, resolvedById: modId, resolvedAt: new Date() }).where(eq(privacyRequests.id, id));
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao resolver." };
  }
}
