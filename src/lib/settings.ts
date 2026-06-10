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

// ── Configurações de perfil (nome de exibição) ───────────────────────────

export type ProfileSettings = {
  nameMin: number;
  nameMax: number;
};

const PROFILE_DEFAULTS: ProfileSettings = { nameMin: 2, nameMax: 120 };

export function sanitizeProfileSettings(raw: unknown): ProfileSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  let nameMin = Math.max(1, Math.min(50, Math.floor(Number(r.nameMin) || PROFILE_DEFAULTS.nameMin)));
  let nameMax = Math.max(2, Math.min(200, Math.floor(Number(r.nameMax) || PROFILE_DEFAULTS.nameMax)));
  if (nameMin > nameMax) [nameMin, nameMax] = [nameMax, nameMin];
  return { nameMin, nameMax };
}

export async function getProfileSettings(): Promise<ProfileSettings> {
  const raw = await getSetting<Partial<ProfileSettings>>("profile", PROFILE_DEFAULTS);
  return sanitizeProfileSettings({ ...PROFILE_DEFAULTS, ...raw });
}

// ── Configurações de reputação & reações ─────────────────────────────────

export type ReputationSettings = {
  enabled: boolean;
  excludeRoles: string[]; // papéis cujo conteúdo não recebe reações
  reactToOwn: boolean; // pode reagir ao próprio conteúdo
  showOnProfile: boolean; // exibir reputação total no perfil
  highlightThreshold: number; // destacar conteúdo com >= X (0 = nunca)
  reactionDisplay: "individual" | "total";
  leaderboardEnabled: boolean;
  leaderboardExcludeRoles: string[];
  leaderboardTimezone: string;
};

const REP_DEFAULTS: ReputationSettings = {
  enabled: true,
  excludeRoles: [],
  reactToOwn: false,
  showOnProfile: true,
  highlightThreshold: 0,
  reactionDisplay: "individual",
  leaderboardEnabled: true,
  leaderboardExcludeRoles: [],
  leaderboardTimezone: "UTC",
};

const REP_ROLES = ["member", "contributor", "moderator", "admin"];

export function sanitizeReputationSettings(raw: unknown): ReputationSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const roles = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => REP_ROLES.includes(x as string)) : []);
  return {
    enabled: r.enabled === undefined ? REP_DEFAULTS.enabled : Boolean(r.enabled),
    excludeRoles: roles(r.excludeRoles),
    reactToOwn: Boolean(r.reactToOwn),
    showOnProfile: r.showOnProfile === undefined ? REP_DEFAULTS.showOnProfile : Boolean(r.showOnProfile),
    highlightThreshold: Math.max(0, Math.min(100000, Math.floor(Number(r.highlightThreshold) || 0))),
    reactionDisplay: r.reactionDisplay === "total" ? "total" : "individual",
    leaderboardEnabled: r.leaderboardEnabled === undefined ? REP_DEFAULTS.leaderboardEnabled : Boolean(r.leaderboardEnabled),
    leaderboardExcludeRoles: roles(r.leaderboardExcludeRoles),
    leaderboardTimezone: typeof r.leaderboardTimezone === "string" && r.leaderboardTimezone ? r.leaderboardTimezone.slice(0, 60) : "UTC",
  };
}

export async function getReputationSettings(): Promise<ReputationSettings> {
  const raw = await getSetting<Partial<ReputationSettings>>("reputation", REP_DEFAULTS);
  return sanitizeReputationSettings({ ...REP_DEFAULTS, ...raw });
}

// ── Configurações de denúncias (moderação de conteúdo) ───────────────────

export type ReportingSettings = {
  messageMandatory: boolean;
  autoModEnabled: boolean;
  autoModThreshold: number; // nº de denunciantes únicos para ocultar
};

const REPORTING_DEFAULTS: ReportingSettings = { messageMandatory: false, autoModEnabled: false, autoModThreshold: 5 };

export function sanitizeReportingSettings(raw: unknown): ReportingSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    messageMandatory: Boolean(r.messageMandatory),
    autoModEnabled: Boolean(r.autoModEnabled),
    autoModThreshold: Math.max(1, Math.min(1000, Math.floor(Number(r.autoModThreshold) || REPORTING_DEFAULTS.autoModThreshold))),
  };
}

export async function getReportingSettings(): Promise<ReportingSettings> {
  const raw = await getSetting<Partial<ReportingSettings>>("reporting", REPORTING_DEFAULTS);
  return sanitizeReportingSettings({ ...REPORTING_DEFAULTS, ...raw });
}

// ── Configurações de prevenção de spam (RetroGuard + flag) ───────────────

export type SpamSettings = {
  difficulty: number; // bits do proof-of-work do RetroGuard (8–24)
  flagRestrict: boolean; // ao marcar spammer: impedir novos envios (suspender)
  flagHide: boolean; // ao marcar spammer: ocultar conteúdo já enviado
  flagBan: boolean; // ao marcar spammer: banir e-mail
};

const SPAM_DEFAULTS: SpamSettings = { difficulty: 16, flagRestrict: true, flagHide: true, flagBan: false };

export function sanitizeSpamSettings(raw: unknown): SpamSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    difficulty: Math.max(8, Math.min(24, Math.floor(Number(r.difficulty) || SPAM_DEFAULTS.difficulty))),
    flagRestrict: r.flagRestrict === undefined ? SPAM_DEFAULTS.flagRestrict : Boolean(r.flagRestrict),
    flagHide: r.flagHide === undefined ? SPAM_DEFAULTS.flagHide : Boolean(r.flagHide),
    flagBan: Boolean(r.flagBan),
  };
}

export async function getSpamSettings(): Promise<SpamSettings> {
  const raw = await getSetting<Partial<SpamSettings>>("spam", SPAM_DEFAULTS);
  return sanitizeSpamSettings({ ...SPAM_DEFAULTS, ...raw });
}

// ── Configurações de advertências (warnings) ─────────────────────────────

export type WarningSettings = {
  enabled: boolean;
  cannotWarnRoles: string[];
  membersCanSee: boolean;
  mustAcknowledge: boolean;
};

const WARN_DEFAULTS: WarningSettings = { enabled: true, cannotWarnRoles: ["admin"], membersCanSee: true, mustAcknowledge: false };
const WARN_ROLES = ["member", "contributor", "moderator", "admin"];

export function sanitizeWarningSettings(raw: unknown): WarningSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    enabled: r.enabled === undefined ? WARN_DEFAULTS.enabled : Boolean(r.enabled),
    cannotWarnRoles: Array.isArray(r.cannotWarnRoles) ? r.cannotWarnRoles.filter((x): x is string => WARN_ROLES.includes(x as string)) : [],
    membersCanSee: r.membersCanSee === undefined ? WARN_DEFAULTS.membersCanSee : Boolean(r.membersCanSee),
    mustAcknowledge: Boolean(r.mustAcknowledge),
  };
}

export async function getWarningSettings(): Promise<WarningSettings> {
  const raw = await getSetting<Partial<WarningSettings>>("warnings", WARN_DEFAULTS);
  return sanitizeWarningSettings({ ...WARN_DEFAULTS, ...raw });
}

// ── Configurações de atribuições (assignments) ───────────────────────────

export type AssignmentSettings = { enabled: boolean; autoCloseDays: number };

const ASSIGN_DEFAULTS: AssignmentSettings = { enabled: true, autoCloseDays: 0 };

export function sanitizeAssignmentSettings(raw: unknown): AssignmentSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    enabled: r.enabled === undefined ? ASSIGN_DEFAULTS.enabled : Boolean(r.enabled),
    autoCloseDays: Math.max(0, Math.min(3650, Math.floor(Number(r.autoCloseDays) || 0))),
  };
}

export async function getAssignmentSettings(): Promise<AssignmentSettings> {
  const raw = await getSetting<Partial<AssignmentSettings>>("assignments", ASSIGN_DEFAULTS);
  return sanitizeAssignmentSettings({ ...ASSIGN_DEFAULTS, ...raw });
}

// ── Configurações de staff (selo, expurgo de logs) ───────────────────────

export type StaffSettings = { showBadge: boolean; logPruneDays: number };

const STAFF_DEFAULTS: StaffSettings = { showBadge: true, logPruneDays: 0 };

export function sanitizeStaffSettings(raw: unknown): StaffSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    showBadge: r.showBadge === undefined ? STAFF_DEFAULTS.showBadge : Boolean(r.showBadge),
    logPruneDays: Math.max(0, Math.min(3650, Math.floor(Number(r.logPruneDays) || 0))),
  };
}

export async function getStaffSettings(): Promise<StaffSettings> {
  const raw = await getSetting<Partial<StaffSettings>>("staff", STAFF_DEFAULTS);
  return sanitizeStaffSettings({ ...STAFF_DEFAULTS, ...raw });
}

// ── Galeria de fotos ──────────────────────────────────────────────────────

export type GallerySettings = { enabled: boolean; maxPhotos: number };
const GALLERY_DEFAULTS: GallerySettings = { enabled: true, maxPhotos: 12 };

export function sanitizeGallerySettings(raw: unknown): GallerySettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    enabled: r.enabled === undefined ? GALLERY_DEFAULTS.enabled : Boolean(r.enabled),
    maxPhotos: Math.max(1, Math.min(100, Math.floor(Number(r.maxPhotos) || GALLERY_DEFAULTS.maxPhotos))),
  };
}

export async function getGallerySettings(): Promise<GallerySettings> {
  const raw = await getSetting<Partial<GallerySettings>>("gallery", GALLERY_DEFAULTS);
  return sanitizeGallerySettings({ ...GALLERY_DEFAULTS, ...raw });
}

// ── Conclusão de perfil (nudge pós-cadastro) ──────────────────────────────

export type ProfileCompletionSettings = { enabled: boolean; requireAvatar: boolean; requireFields: boolean };
const COMPLETION_DEFAULTS: ProfileCompletionSettings = { enabled: true, requireAvatar: true, requireFields: true };

export function sanitizeProfileCompletionSettings(raw: unknown): ProfileCompletionSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    enabled: r.enabled === undefined ? COMPLETION_DEFAULTS.enabled : Boolean(r.enabled),
    requireAvatar: r.requireAvatar === undefined ? COMPLETION_DEFAULTS.requireAvatar : Boolean(r.requireAvatar),
    requireFields: r.requireFields === undefined ? COMPLETION_DEFAULTS.requireFields : Boolean(r.requireFields),
  };
}

export async function getProfileCompletionSettings(): Promise<ProfileCompletionSettings> {
  const raw = await getSetting<Partial<ProfileCompletionSettings>>("profile_completion", COMPLETION_DEFAULTS);
  return sanitizeProfileCompletionSettings({ ...COMPLETION_DEFAULTS, ...raw });
}
