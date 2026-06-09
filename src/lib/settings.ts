import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

/** Lê uma configuração (chave/valor JSON), com fallback. */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const [row] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, key)).limit(1);
    return row ? (row.value as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key, value: value as object })
    .onDuplicateKeyUpdate({ set: { value: value as object } });
}

// ── Configurações de conquistas ──────────────────────────────────────────

export type AchievementSettings = {
  enabled: boolean;
  rareThreshold: number; // % de membros abaixo do qual a badge é "rara"
  rareNever: boolean; // se true, nunca marcar como rara
  excludeRoles: string[]; // papéis que não ganham pontos/badges/ranks
};

const DEFAULTS: AchievementSettings = {
  enabled: true,
  rareThreshold: 5,
  rareNever: false,
  excludeRoles: [],
};

const ROLES = ["member", "contributor", "moderator", "admin"];

export function sanitizeAchievementSettings(raw: unknown): AchievementSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    enabled: r.enabled === undefined ? DEFAULTS.enabled : Boolean(r.enabled),
    rareThreshold: Math.max(0, Math.min(100, Number(r.rareThreshold) || 0)),
    rareNever: Boolean(r.rareNever),
    excludeRoles: Array.isArray(r.excludeRoles) ? r.excludeRoles.filter((x): x is string => ROLES.includes(x as string)) : [],
  };
}

export async function getAchievementSettings(): Promise<AchievementSettings> {
  const raw = await getSetting<Partial<AchievementSettings>>("achievements", DEFAULTS);
  return sanitizeAchievementSettings({ ...DEFAULTS, ...raw });
}
