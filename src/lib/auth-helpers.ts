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

/** Usuário completo do banco a partir da sessão, ou null. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(session.user.id)))
    .limit(1);
  return user ?? null;
}

export type SessionUser = { id: string; role: UserRole; handle: string };

/** Garante que há um usuário autenticado; lança caso contrário. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  return {
    id: session.user.id,
    role: session.user.role,
    handle: session.user.handle,
  };
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
