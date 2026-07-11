import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberIps } from "@/db/schema";
import { geoForIps } from "@/lib/geo";

export type RecentAccess = {
  id: number; ip: string; device: string; location: string;
  uses: number; firstUsedAt: Date; lastUsedAt: Date;
};

/** Resumo legível do dispositivo a partir do user-agent (navegador + sistema). */
export function describeUserAgent(ua: string | null): string {
  if (!ua) return "Dispositivo desconhecido";
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /OPR\/|Opera/.test(ua) ? "Opera" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Safari\//.test(ua) ? "Safari" : "Navegador";
  const os =
    /Windows/.test(ua) ? "Windows" :
    /iPhone|iPad|iOS/.test(ua) ? "iOS" :
    /Android/.test(ua) ? "Android" :
    /Mac OS X|Macintosh/.test(ua) ? "macOS" :
    /Linux/.test(ua) ? "Linux" : "outro sistema";
  return `${browser} · ${os}`;
}

/** Acessos recentes do usuário (por IP), com dispositivo e localização. */
export async function listRecentAccess(userId: number, limit = 15): Promise<RecentAccess[]> {
  try {
    const rows = await db
      .select({ id: memberIps.id, ip: memberIps.ip, userAgent: memberIps.userAgent, uses: memberIps.uses, firstUsedAt: memberIps.firstUsedAt, lastUsedAt: memberIps.lastUsedAt })
      .from(memberIps)
      .where(eq(memberIps.userId, userId))
      .orderBy(desc(memberIps.lastUsedAt))
      .limit(limit);
    const geo = await geoForIps(rows.map((r) => r.ip));
    return rows.map((r) => ({
      id: r.id, ip: r.ip, device: describeUserAgent(r.userAgent),
      location: geo.get(r.ip) || "Local desconhecido",
      uses: r.uses, firstUsedAt: r.firstUsedAt, lastUsedAt: r.lastUsedAt,
    }));
  } catch {
    return [];
  }
}
