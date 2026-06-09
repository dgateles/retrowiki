import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { banFilters } from "@/db/schema";
import type { BanType, BanFilter } from "@/lib/ban-types";

export type { BanType, BanFilter } from "@/lib/ban-types";
export { BAN_TYPE_LABEL } from "@/lib/ban-types";

/** Converte um padrão com curinga * em RegExp ancorada, case-insensitive. */
function wildcardToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

export function matchesWildcard(pattern: string, value: string): boolean {
  try {
    return wildcardToRegex(pattern).test(value);
  } catch {
    return false;
  }
}

export async function listBanFilters(): Promise<BanFilter[]> {
  try {
    const rows = await db.select().from(banFilters).orderBy(desc(banFilters.createdAt), desc(banFilters.id));
    return rows.map((r) => ({ id: r.id, type: r.type as BanType, content: r.content, reason: r.reason, createdAt: r.createdAt }));
  } catch {
    return [];
  }
}

export async function createBanFilter(type: BanType, content: string, reason: string, actorId: number): Promise<number | null> {
  try {
    const [res] = await db.insert(banFilters).values({ type, content, reason, actorId });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function deleteBanFilter(id: number): Promise<boolean> {
  try {
    await db.delete(banFilters).where(eq(banFilters.id, id));
    return true;
  } catch {
    return false;
  }
}

/** Retorna o filtro que bate com o valor (ou null). Best-effort: não lança. */
export async function checkBan(type: BanType, value: string): Promise<BanFilter | null> {
  const v = (value ?? "").trim();
  if (!v) return null;
  try {
    const rows = await db.select().from(banFilters).where(eq(banFilters.type, type));
    for (const r of rows) {
      if (matchesWildcard(r.content, v)) {
        return { id: r.id, type: r.type as BanType, content: r.content, reason: r.reason, createdAt: r.createdAt };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** True se algum dos sinais (e-mail/IP/nome) bate em um filtro de ban. */
export async function isBanned(signals: { email?: string; ip?: string; name?: string }): Promise<boolean> {
  if (signals.email && (await checkBan("email", signals.email))) return true;
  if (signals.ip && (await checkBan("ip", signals.ip))) return true;
  if (signals.name && (await checkBan("name", signals.name))) return true;
  return false;
}
