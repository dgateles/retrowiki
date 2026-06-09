import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationPrefs } from "@/db/schema";
import { getSetting, setSetting } from "@/lib/settings";
import {
  NOTIFICATION_CATEGORIES,
  DEFAULT_CONFIG,
  sanitizeNotificationsConfig,
  categoryForType,
  type NotificationsConfig,
  type ChannelMode,
} from "@/lib/notifications-config";

export async function getNotificationsConfig(): Promise<NotificationsConfig> {
  const raw = await getSetting<Partial<NotificationsConfig>>("notifications", DEFAULT_CONFIG);
  return sanitizeNotificationsConfig({ ...DEFAULT_CONFIG, ...raw });
}

export async function saveNotificationsConfig(raw: unknown): Promise<void> {
  await setSetting("notifications", sanitizeNotificationsConfig(raw));
}

function defaultEnabled(mode: ChannelMode): boolean {
  return mode === "default_on";
}

/** Decide se a notificação do sino deve ser criada para este usuário/tipo. */
export async function isInAppAllowed(userId: number, type: string): Promise<boolean> {
  const cat = categoryForType(type);
  if (!cat) return true; // tipos fora de categoria (ex.: fila de moderação) sempre passam
  try {
    const config = await getNotificationsConfig();
    const c = config[cat.key];
    if (!c) return true;
    if (c.inApp === "disabled") return false;
    // preferência do membro tem prioridade sobre o default
    const [pref] = await db
      .select({ enabled: notificationPrefs.enabled })
      .from(notificationPrefs)
      .where(and(eq(notificationPrefs.userId, userId), eq(notificationPrefs.type, cat.key), eq(notificationPrefs.channel, "in_app")))
      .limit(1);
    if (pref) return pref.enabled;
    return defaultEnabled(c.inApp);
  } catch {
    return true; // em caso de erro, não silenciar notificações
  }
}

// ── Preferências do membro (página /conta) ────────────────────────────────

export type MemberCategoryPref = {
  key: string;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
  inAppLocked: boolean; // canal desabilitado pelo admin
  emailLocked: boolean;
  editable: boolean; // membro pode editar esta categoria
};

export async function getMemberPrefs(userId: number): Promise<MemberCategoryPref[]> {
  const config = await getNotificationsConfig();
  const rows = await db
    .select({ type: notificationPrefs.type, channel: notificationPrefs.channel, enabled: notificationPrefs.enabled })
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId));
  const prefMap = new Map<string, boolean>();
  for (const r of rows) prefMap.set(`${r.type}:${r.channel}`, r.enabled);

  const resolve = (key: string, channel: "in_app" | "email", mode: ChannelMode): boolean => {
    if (mode === "disabled") return false;
    const p = prefMap.get(`${key}:${channel}`);
    return p === undefined ? defaultEnabled(mode) : p;
  };

  return NOTIFICATION_CATEGORIES.filter((cat) => {
    const c = config[cat.key];
    // some da página se ambos os canais estão desabilitados pelo admin
    return c && !(c.inApp === "disabled" && c.email === "disabled");
  }).map((cat) => {
    const c = config[cat.key];
    return {
      key: cat.key,
      label: cat.label,
      description: cat.description,
      inApp: resolve(cat.key, "in_app", c.inApp),
      email: resolve(cat.key, "email", c.email),
      inAppLocked: c.inApp === "disabled",
      emailLocked: c.email === "disabled",
      editable: c.memberEditable,
    };
  });
}

export async function saveMemberPrefs(userId: number, input: Record<string, { inApp: boolean; email: boolean }>): Promise<void> {
  const config = await getNotificationsConfig();
  for (const cat of NOTIFICATION_CATEGORIES) {
    const c = config[cat.key];
    if (!c || !c.memberEditable) continue; // só salva o que o membro pode editar
    const wanted = input[cat.key];
    if (!wanted) continue;
    const upsert = async (channel: "in_app" | "email", enabled: boolean, mode: ChannelMode) => {
      if (mode === "disabled") return; // canal travado: não grava
      await db
        .insert(notificationPrefs)
        .values({ userId, type: cat.key, channel, enabled })
        .onDuplicateKeyUpdate({ set: { enabled } });
    };
    await upsert("in_app", Boolean(wanted.inApp), c.inApp);
    await upsert("email", Boolean(wanted.email), c.email);
  }
}

/** Reset: apaga todas as preferências de notificação (volta aos defaults). */
export async function resetAllMemberPrefs(): Promise<void> {
  await db.delete(notificationPrefs);
}
