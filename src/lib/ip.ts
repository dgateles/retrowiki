import "server-only";
import { headers } from "next/headers";
import { and, desc, eq, inArray, like, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { memberIps, users } from "@/db/schema";

export type StaffLogin = { handle: string; displayName: string; role: string; ip: string; lastUsedAt: Date };

/** Logins recentes da equipe (moderadores e admins), do registro de IPs. */
export async function getStaffLogins(limit = 20): Promise<StaffLogin[]> {
  try {
    return await db
      .select({ handle: users.handle, displayName: users.displayName, role: users.role, ip: memberIps.ip, lastUsedAt: memberIps.lastUsedAt })
      .from(memberIps)
      .innerJoin(users, eq(users.id, memberIps.userId))
      .where(inArray(users.role, ["moderator", "admin"]))
      .orderBy(desc(memberIps.lastUsedAt))
      .limit(limit);
  } catch {
    return [];
  }
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim() || "desconhecido";
}

async function getUserAgent(): Promise<string> {
  const h = await headers();
  return (h.get("user-agent") ?? "").slice(0, 400);
}

/** Registra (agrega) um uso de IP por um membro e atualiza a presença. */
export async function recordMemberIp(userId: number): Promise<void> {
  try {
    const ip = await getClientIp();
    const ua = await getUserAgent();
    await db
      .insert(memberIps)
      .values({ userId, ip, userAgent: ua, uses: 1 })
      .onDuplicateKeyUpdate({ set: { uses: sql`${memberIps.uses} + 1`, lastUsedAt: new Date(), userAgent: ua } });
    await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, userId));
  } catch {
    // não bloquear o fluxo por falha de registro
  }
}

/** Rótulo simples de dispositivo a partir do user-agent. */
export function deviceLabel(ua: string | null): string {
  if (!ua) return "Desconhecido";
  const os = /Windows/i.test(ua) ? "Windows" : /Mac OS X|Macintosh/i.test(ua) ? "macOS" : /Android/i.test(ua) ? "Android" : /iPhone|iPad|iOS/i.test(ua) ? "iOS" : /Linux/i.test(ua) ? "Linux" : "Outro";
  const br = /Edg\//i.test(ua) ? "Edge" : /OPR\//i.test(ua) ? "Opera" : /Chrome\//i.test(ua) ? "Chrome" : /Firefox\//i.test(ua) ? "Firefox" : /Safari\//i.test(ua) ? "Safari" : "Navegador";
  return `${br} no ${os}`;
}

export type IpRow = { ip: string; userAgent: string | null; uses: number; firstUsedAt: Date; lastUsedAt: Date };

export async function getMemberIps(userId: number): Promise<IpRow[]> {
  try {
    return await db
      .select({ ip: memberIps.ip, userAgent: memberIps.userAgent, uses: memberIps.uses, firstUsedAt: memberIps.firstUsedAt, lastUsedAt: memberIps.lastUsedAt })
      .from(memberIps)
      .where(eq(memberIps.userId, userId))
      .orderBy(desc(memberIps.lastUsedAt))
      .limit(100);
  } catch {
    return [];
  }
}

export type IpMatch = { userId: number; handle: string; displayName: string; ip: string; uses: number; lastUsedAt: Date };

/** Busca por IP (curinga `*` vira `%`). Lista os membros que usaram o IP. */
export async function lookupIp(pattern: string): Promise<IpMatch[]> {
  const raw = pattern.trim();
  if (!raw) return [];
  const sqlPattern = raw.replace(/[%_\\]/g, "\\$&").replace(/\*/g, "%");
  try {
    return await db
      .select({ userId: memberIps.userId, handle: users.handle, displayName: users.displayName, ip: memberIps.ip, uses: memberIps.uses, lastUsedAt: memberIps.lastUsedAt })
      .from(memberIps)
      .innerJoin(users, eq(users.id, memberIps.userId))
      .where(like(memberIps.ip, sqlPattern))
      .orderBy(desc(memberIps.lastUsedAt))
      .limit(200);
  } catch {
    return [];
  }
}

export type MemberHit = { id: number; handle: string; displayName: string };

/** Busca membros por nome/handle (para o "Member Lookup"). */
export async function searchMembers(q: string): Promise<MemberHit[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const p = `%${term.replace(/[%_\\]/g, "\\$&")}%`;
  try {
    return await db
      .select({ id: users.id, handle: users.handle, displayName: users.displayName })
      .from(users)
      .where(sql`${users.displayName} LIKE ${p} OR ${users.handle} LIKE ${p}`)
      .limit(20);
  } catch {
    return [];
  }
}

/** Expurgo de IPs antigos (LGPD). Para um cron. */
export async function purgeOldIps(days: number): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - days * 86400_000);
    const res = await db.delete(memberIps).where(lt(memberIps.lastUsedAt, cutoff));
    return (res as unknown as { affectedRows?: number }).affectedRows ?? 0;
  } catch {
    return 0;
  }
}
