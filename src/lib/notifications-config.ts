// Categorias de notificação do RetroWiki e a configuração de admin (defaults +
// se o membro pode editar). Mapeia os tipos granulares para categorias.

export type ChannelMode = "default_on" | "default_off" | "disabled";

export type NotificationCategory = {
  key: string;
  label: string;
  description: string;
  types: string[]; // tipos granulares que caem nesta categoria
};

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    key: "achievements",
    label: "Conquistas",
    description: "Quando você ganha um rank, badge, conclui uma missão ou é promovido.",
    types: ["badge.earned", "rank.up", "quest.completed", "role.promoted"],
  },
  {
    key: "replies",
    label: "Respostas e menções",
    description: "Quando alguém responde ou cita você em um comentário.",
    types: ["comment.reply", "comment.quote"],
  },
  {
    key: "moderation",
    label: "Moderação do seu conteúdo",
    description: "Quando um guia seu é aprovado, rejeitado ou precisa de ajustes.",
    types: ["article.approved", "article.changes_requested", "article.rejected"],
  },
];

export type CategoryConfig = { memberEditable: boolean; inApp: ChannelMode; email: ChannelMode };
export type NotificationsConfig = Record<string, CategoryConfig>;

export const DEFAULT_CONFIG: NotificationsConfig = {
  achievements: { memberEditable: true, inApp: "default_on", email: "default_off" },
  replies: { memberEditable: true, inApp: "default_on", email: "default_off" },
  moderation: { memberEditable: true, inApp: "default_on", email: "default_off" },
};

const MODES: ChannelMode[] = ["default_on", "default_off", "disabled"];

export function sanitizeNotificationsConfig(raw: unknown): NotificationsConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: NotificationsConfig = {};
  for (const cat of NOTIFICATION_CATEGORIES) {
    const c = (r[cat.key] && typeof r[cat.key] === "object" ? r[cat.key] : {}) as Record<string, unknown>;
    const def = DEFAULT_CONFIG[cat.key];
    const mode = (v: unknown, d: ChannelMode): ChannelMode => (MODES.includes(v as ChannelMode) ? (v as ChannelMode) : d);
    out[cat.key] = {
      memberEditable: c.memberEditable === undefined ? def.memberEditable : Boolean(c.memberEditable),
      inApp: mode(c.inApp, def.inApp),
      email: mode(c.email, def.email),
    };
  }
  return out;
}

/** Categoria de um tipo granular, ou null se não pertence a nenhuma. */
export function categoryForType(type: string): NotificationCategory | null {
  return NOTIFICATION_CATEGORIES.find((c) => c.types.includes(type)) ?? null;
}
