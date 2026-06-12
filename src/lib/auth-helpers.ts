import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/auth";
import type { User, UserRole } from "@/db/schema";

/** Sessão atual (id, role, handle) ou null. */
export async function getSession() {
  return auth();
}

const SEEN_THROTTLE_MS = 5 * 60 * 1000;

/** Usuário completo do banco a partir da sessão, ou null. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(session.user.id)))
    .limit(1);
  if (!user) return null;
  // Sessão revogada: usuário suspenso ou senha trocada (sessionVersion mudou).
  if (user.isSuspended || user.sessionVersion !== (session.user.sv ?? 0)) return null;

  // Presença: atualiza "visto por último" no máximo a cada 5 min.
  const last = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : 0;
  if (Date.now() - last > SEEN_THROTTLE_MS) {
    try {
      await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, user.id));
    } catch {
      /* não bloquear */
    }
  }
  return user;
}

export type SessionUser = { id: string; role: UserRole; handle: string };

/** Garante que há um usuário autenticado; lança caso contrário. Revalida contra
 * o banco (papel/suspensão/sessionVersion atuais), não confia só no JWT — assim
 * suspensão, rebaixamento e troca de senha têm efeito imediato. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  const [u] = await db
    .select({ id: users.id, role: users.role, handle: users.handle, isSuspended: users.isSuspended, sessionVersion: users.sessionVersion })
    .from(users)
    .where(eq(users.id, Number(session.user.id)))
    .limit(1);
  if (!u || u.isSuspended || u.sessionVersion !== (session.user.sv ?? 0)) throw new Error("UNAUTHENTICATED");
  return { id: String(u.id), role: u.role, handle: u.handle };
}

const RANK: Record<UserRole, number> = {
  member: 0,
  contributor: 1,
  moderator: 2,
  admin: 3,
};

/** Garante papel mínimo; lança "FORBIDDEN" se insuficiente. */
export async function requireRole(min: UserRole): Promise<SessionUser> {
  const user = await requireUser();
  if (RANK[user.role] < RANK[min]) throw new Error("FORBIDDEN");
  return user;
}

export const can = {
  submit: (u: { role: UserRole } | null) => !!u,
  moderate: (u: { role: UserRole } | null) =>
    u?.role === "moderator" || u?.role === "admin",
  admin: (u: { role: UserRole } | null) => u?.role === "admin",
  publishDirectly: (u: User | null) =>
    !!u && (u.role === "moderator" || u.role === "admin" || u.trusted),
};
