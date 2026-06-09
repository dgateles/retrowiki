import "server-only";
import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { rolePermissions, users } from "@/db/schema";

export const ROLES = ["member", "contributor", "moderator", "admin"] as const;
export type Role = (typeof ROLES)[number];

export type FieldType = "bool" | "number" | "color";
export type Tab = "settings" | "content" | "social";
export type PermField = { key: string; label: string; type: FieldType; tab: Tab; help?: string };

// Campos de permissão (adaptados do AdminCP do IPB ao nosso cenário).
export const PERM_FIELDS: PermField[] = [
  { key: "canAccessSite", label: "Pode acessar o site", type: "bool", tab: "settings" },
  { key: "canChangeDisplayName", label: "Pode trocar o nome de exibição", type: "bool", tab: "settings" },
  { key: "color", label: "Cor do papel (selo)", type: "color", tab: "settings", help: "Cor usada no selo do papel." },

  { key: "canEditOwn", label: "Pode editar o próprio conteúdo", type: "bool", tab: "content" },
  { key: "editTimeLimitMin", label: "Tempo para editar o próprio conteúdo (min, 0 = sem limite)", type: "number", tab: "content" },
  { key: "canDeleteOwn", label: "Pode excluir o próprio conteúdo", type: "bool", tab: "content" },
  { key: "maxPerDay", label: "Máximo de itens por dia (0 = ilimitado)", type: "number", tab: "content" },
  { key: "bypassReview", label: "Publica sem passar pela fila de revisão", type: "bool", tab: "content", help: "Equivale ao 'confiável' no nível do papel." },
  { key: "requireApproval", label: "Exige aprovação antes de publicar", type: "bool", tab: "content" },
  { key: "canReport", label: "Pode denunciar conteúdo", type: "bool", tab: "content" },

  { key: "canEditProfile", label: "Pode editar o perfil", type: "bool", tab: "social" },
  { key: "canUploadAvatar", label: "Pode enviar avatar", type: "bool", tab: "social" },
  { key: "canUploadCover", label: "Pode enviar capa", type: "bool", tab: "social" },
  { key: "maxReactionsPerDay", label: "Máximo de reações por dia (0 = ilimitado)", type: "number", tab: "social" },
  { key: "canViewFollowers", label: "Pode ver seguidores", type: "bool", tab: "social" },
];

export type Permissions = Record<string, boolean | number | string>;

const BASE: Permissions = {
  canAccessSite: true,
  canChangeDisplayName: true,
  color: "#64748b",
  canEditOwn: true,
  editTimeLimitMin: 30,
  canDeleteOwn: true,
  maxPerDay: 0,
  bypassReview: false,
  requireApproval: false,
  canReport: true,
  canEditProfile: true,
  canUploadAvatar: true,
  canUploadCover: true,
  maxReactionsPerDay: 0,
  canViewFollowers: true,
};

export const DEFAULTS: Record<Role, Permissions> = {
  member: { ...BASE },
  contributor: { ...BASE, bypassReview: true, color: "#22c55e" },
  moderator: { ...BASE, bypassReview: true, color: "#3b82f6" },
  admin: { ...BASE, bypassReview: true, color: "#a855f7" },
};

export const ROLE_LABEL: Record<Role, string> = {
  member: "Membros",
  contributor: "Colaboradores",
  moderator: "Moderadores",
  admin: "Administradores",
};

export function isRole(r: string): r is Role {
  return (ROLES as readonly string[]).includes(r);
}

// Normaliza um objeto cru contra os campos conhecidos (tipos seguros).
export function sanitizePermissions(role: Role, raw: unknown): Permissions {
  const base = DEFAULTS[role];
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Permissions = { ...base };
  for (const f of PERM_FIELDS) {
    const v = input[f.key];
    if (v === undefined) continue;
    if (f.type === "bool") out[f.key] = Boolean(v);
    else if (f.type === "number") out[f.key] = Math.max(0, Math.min(100000, Math.floor(Number(v) || 0)));
    else if (f.type === "color") out[f.key] = /^#[0-9a-fA-F]{3,8}$/.test(String(v)) ? String(v) : String(base[f.key]);
  }
  return out;
}

export async function getRolePermissions(role: Role): Promise<Permissions> {
  try {
    const [row] = await db.select({ p: rolePermissions.permissions }).from(rolePermissions).where(eq(rolePermissions.role, role)).limit(1);
    return sanitizePermissions(role, { ...DEFAULTS[role], ...(row?.p as object | undefined) });
  } catch {
    return DEFAULTS[role];
  }
}

export async function saveRolePermissions(role: Role, perms: Permissions): Promise<void> {
  const clean = sanitizePermissions(role, perms);
  await db
    .insert(rolePermissions)
    .values({ role, permissions: clean })
    .onDuplicateKeyUpdate({ set: { permissions: clean } });
}

export async function getRoleCounts(): Promise<Record<string, number>> {
  try {
    const rows = await db.select({ role: users.role, n: count() }).from(users).groupBy(users.role);
    const map: Record<string, number> = {};
    for (const r of rows) map[r.role] = Number(r.n);
    return map;
  } catch {
    return {};
  }
}
