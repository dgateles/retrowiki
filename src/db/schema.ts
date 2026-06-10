import {
  mysqlTable,
  bigint,
  int,
  varchar,
  text,
  boolean,
  float,
  json,
  datetime,
  mysqlEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// Helpers -----------------------------------------------------------------
const pk = () => bigint("id", { mode: "number" }).autoincrement().primaryKey();
const createdAt = () =>
  datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`);
const updatedAt = () =>
  datetime("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date());

// ── Comunidade: usuários, papéis, tokens ─────────────────────────────────
export const users = mysqlTable(
  "users",
  {
    id: pk(),
    email: varchar("email", { length: 255 }).notNull(),
    handle: varchar("handle", { length: 60 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: mysqlEnum("role", ["member", "contributor", "moderator", "admin"])
      .notNull()
      .default("member"),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    coverUrl: varchar("cover_url", { length: 500 }), // capa do perfil (BunnyCDN)
    postingRestrictedUntil: datetime("posting_restricted_until"), // advertências
    contentModeratedUntil: datetime("content_moderated_until"), // advertências: conteúdo novo vai à revisão
    referredById: bigint("referred_by_id", { mode: "number" }), // quem indicou no cadastro
    bulkMailOptOut: boolean("bulk_mail_opt_out").notNull().default(false), // e-mail em massa
    deletedAt: datetime("deleted_at"), // conta anonimizada (LGPD)
    reputation: int("reputation").notNull().default(0),
    trusted: boolean("trusted").notNull().default(false),
    isSuspended: boolean("is_suspended").notNull().default(false),
    emailVerifiedAt: datetime("email_verified_at"),
    lastSeenAt: datetime("last_seen_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    uniqueIndex("users_handle_idx").on(t.handle),
  ],
);

export const verificationTokens = mysqlTable("verification_tokens", {
  id: pk(),
  userId: bigint("user_id", { mode: "number" }),
  email: varchar("email", { length: 255 }).notNull(),
  purpose: mysqlEnum("purpose", [
    "email_verify",
    "password_reset",
    "email_change",
    "magic_link",
  ]).notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: datetime("expires_at").notNull(),
  consumedAt: datetime("consumed_at"),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("vt_token_hash_idx").on(t.tokenHash),
  index("vt_email_purpose_idx").on(t.email, t.purpose),
]);

// ── Catálogo: devices, specs, emulação, categorias, imagens ──────────────
export const devices = mysqlTable(
  "devices",
  {
    id: pk(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    manufacturer: varchar("manufacturer", { length: 120 }).notNull(),
    releaseYear: int("release_year"),
    priceUsd: int("price_usd"),
    formFactor: mysqlEnum("form_factor", [
      "vertical",
      "horizontal",
      "clamshell",
      "other",
    ])
      .notNull()
      .default("other"),
    rating: float("rating").default(0),
    status: mysqlEnum("status", ["draft", "published", "archived"])
      .notNull()
      .default("published"),
    extra: json("extra"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("devices_slug_idx").on(t.slug),
    index("devices_manufacturer_idx").on(t.manufacturer),
    index("devices_form_factor_idx").on(t.formFactor),
  ],
);

export const deviceSpecs = mysqlTable("device_specs", {
  id: pk(),
  deviceId: bigint("device_id", { mode: "number" }).notNull(),
  cpu: varchar("cpu", { length: 160 }),
  gpu: varchar("gpu", { length: 160 }),
  ramGb: float("ram_gb"),
  ramType: varchar("ram_type", { length: 60 }),
  storage: varchar("storage", { length: 120 }),
  architecture: varchar("architecture", { length: 60 }),
  screenSize: float("screen_size"),
  resolution: varchar("resolution", { length: 40 }),
  aspectRatio: varchar("aspect_ratio", { length: 40 }),
  refreshHz: int("refresh_hz"),
  panelType: varchar("panel_type", { length: 40 }),
  batteryMah: int("battery_mah"),
  cooling: boolean("cooling"),
  vibration: boolean("vibration"),
  os: varchar("os", { length: 120 }),
  wifi: boolean("wifi"),
  bluetooth: boolean("bluetooth"),
  btVersion: varchar("bt_version", { length: 20 }),
  videoOut: boolean("video_out"),
  audioJack: boolean("audio_jack"),
  usbC: boolean("usb_c"),
  sdCard: boolean("sd_card"),
  analogs: boolean("analogs"),
  hallEffect: boolean("hall_effect"),
  analogTriggers: boolean("analog_triggers"),
  l1r1: boolean("l1r1"),
  l2r2: boolean("l2r2"),
  l3r3: boolean("l3r3"),
  touchScreen: boolean("touch_screen"),
  gyroscope: boolean("gyroscope"),
}, (t) => [uniqueIndex("device_specs_device_idx").on(t.deviceId)]);

export const emulationScores = mysqlTable("emulation_scores", {
  id: pk(),
  deviceId: bigint("device_id", { mode: "number" }).notNull(),
  system: varchar("system", { length: 40 }).notNull(),
  score: int("score").notNull(),
}, (t) => [
  uniqueIndex("emu_device_system_idx").on(t.deviceId, t.system),
]);

export const categories = mysqlTable("categories", {
  id: pk(),
  slug: varchar("slug", { length: 80 }).notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  kind: mysqlEnum("kind", ["rating", "power", "size", "os", "form", "generic"])
    .notNull()
    .default("generic"),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("categories_slug_idx").on(t.slug)]);

export const deviceCategories = mysqlTable("device_categories", {
  id: pk(),
  deviceId: bigint("device_id", { mode: "number" }).notNull(),
  categoryId: bigint("category_id", { mode: "number" }).notNull(),
}, (t) => [
  uniqueIndex("device_category_idx").on(t.deviceId, t.categoryId),
]);

export const deviceImages = mysqlTable("device_images", {
  id: pk(),
  deviceId: bigint("device_id", { mode: "number" }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  kind: mysqlEnum("kind", ["front", "article", "gallery"])
    .notNull()
    .default("front"),
  alt: varchar("alt", { length: 300 }).notNull(),
  credit: varchar("credit", { length: 200 }),
  sortOrder: int("sort_order").notNull().default(0),
}, (t) => [index("device_images_device_idx").on(t.deviceId)]);

// ── Conteúdo: artigos (árvore de blocos) + revisões + moderação ──────────
export const articles = mysqlTable(
  "articles",
  {
    id: pk(),
    slug: varchar("slug", { length: 160 }).notNull(),
    // Seção do conteúdo: guia/tutorial (padrão) ou post de blog.
    kind: mysqlEnum("kind", ["guide", "blog"]).notNull().default("guide"),
    type: mysqlEnum("type", [
      "tutorial",
      "buying_guide",
      "troubleshooting",
      "firmware",
      "general",
    ]).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    summary: varchar("summary", { length: 320 }),
    // Imagem de capa (usada nos cards, principalmente no blog).
    coverImage: varchar("cover_image", { length: 500 }),
    deviceId: bigint("device_id", { mode: "number" }),
    authorId: bigint("author_id", { mode: "number" }).notNull(),
    status: mysqlEnum("status", [
      "draft",
      "pending",
      "changes_requested",
      "published",
      "rejected",
      "archived",
    ])
      .notNull()
      .default("draft"),
    currentRevisionId: bigint("current_revision_id", { mode: "number" }),
    searchText: text("search_text"),
    votesUp: int("votes_up").notNull().default(0),
    viewsCount: int("views_count").notNull().default(0),
    publishedAt: datetime("published_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("articles_slug_idx").on(t.slug),
    index("articles_type_status_idx").on(t.type, t.status),
    index("articles_device_idx").on(t.deviceId),
    index("articles_author_idx").on(t.authorId),
  ],
);

export const revisions = mysqlTable("revisions", {
  id: pk(),
  articleId: bigint("article_id", { mode: "number" }).notNull(),
  body: json("body").notNull(), // árvore de blocos (BlockTree)
  // Metadados versionados (proposta de edição num guia publicado).
  title: varchar("title", { length: 200 }),
  type: varchar("type", { length: 40 }),
  deviceId: bigint("device_id", { mode: "number" }),
  editorId: bigint("editor_id", { mode: "number" }).notNull(),
  note: varchar("note", { length: 300 }),
  createdAt: createdAt(),
}, (t) => [index("revisions_article_idx").on(t.articleId)]);

export const reviews = mysqlTable("reviews", {
  id: pk(),
  revisionId: bigint("revision_id", { mode: "number" }).notNull(),
  reviewerId: bigint("reviewer_id", { mode: "number" }),
  decision: mysqlEnum("decision", [
    "pending",
    "approved",
    "changes_requested",
    "rejected",
  ])
    .notNull()
    .default("pending"),
  reason: varchar("reason", { length: 500 }),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("reviews_revision_idx").on(t.revisionId),
  index("reviews_decision_idx").on(t.decision),
]);

export const comments = mysqlTable("comments", {
  id: pk(),
  articleId: bigint("article_id", { mode: "number" }).notNull(),
  authorId: bigint("author_id", { mode: "number" }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["visible", "hidden", "flagged"])
    .notNull()
    .default("visible"),
  createdAt: createdAt(),
  editedAt: datetime("edited_at"),
}, (t) => [index("comments_article_idx").on(t.articleId)]);

export const articleFollows = mysqlTable("article_follows", {
  id: pk(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  articleId: bigint("article_id", { mode: "number" }).notNull(),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("article_follows_user_article_idx").on(t.userId, t.articleId),
  index("article_follows_article_idx").on(t.articleId),
]);

export const votes = mysqlTable("votes", {
  id: pk(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  articleId: bigint("article_id", { mode: "number" }).notNull(),
  reactionId: bigint("reaction_id", { mode: "number" }), // tipo de reação (null = legado "Curtir")
  value: int("value").notNull().default(1), // peso da reação no momento (para a reputação)
  createdAt: createdAt(),
}, (t) => [uniqueIndex("votes_user_article_idx").on(t.userId, t.articleId)]);

// Tipos de reação configuráveis (Curtir, Valeu, Haha…). Peso ajusta a reputação.
export const reactions = mysqlTable("reactions", {
  id: pk(),
  name: varchar("name", { length: 60 }).notNull(),
  emoji: varchar("emoji", { length: 16 }).notNull().default("👍"),
  weight: int("weight").notNull().default(1), // 1 positiva, 0 neutra, -1 negativa
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
}, (t) => [index("reactions_order_idx").on(t.sortOrder)]);

// Níveis de reputação (rótulo por limiar, pode ser negativo). Exibido no perfil.
export const reputationLevels = mysqlTable("reputation_levels", {
  id: pk(),
  title: varchar("title", { length: 80 }).notNull(),
  points: int("points").notNull().default(0), // limiar (>= )
  badge: varchar("badge", { length: 80 }), // slug de badge opcional
  sortOrder: int("sort_order").notNull().default(0),
}, (t) => [index("rep_levels_points_idx").on(t.points)]);

// Visualizações únicas: uma linha por (artigo, visitante). viewerKey = usuário
// logado ou hash do IP. Alimenta articles.views_count.
export const articleViews = mysqlTable("article_views", {
  id: pk(),
  articleId: bigint("article_id", { mode: "number" }).notNull(),
  viewerKey: varchar("viewer_key", { length: 64 }).notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("article_views_article_viewer_idx").on(t.articleId, t.viewerKey)]);

// IPs por membro (agregado). Uma linha por (usuário, IP), com user-agent,
// contagem de usos e primeiro/último uso. Dado pessoal (LGPD): expurgar com o
// tempo e acesso só por admin.
export const memberIps = mysqlTable("member_ips", {
  id: pk(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  ip: varchar("ip", { length: 45 }).notNull(),
  userAgent: varchar("user_agent", { length: 400 }),
  uses: int("uses").notNull().default(1),
  firstUsedAt: datetime("first_used_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastUsedAt: datetime("last_used_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [
  uniqueIndex("member_ips_user_ip_idx").on(t.userId, t.ip),
  index("member_ips_ip_idx").on(t.ip),
]);

// ── Componentes dinâmicos: allowlists ────────────────────────────────────
export const stores = mysqlTable("stores", {
  id: pk(),
  name: varchar("name", { length: 160 }).notNull(),
  domain: varchar("domain", { length: 200 }).notNull(),
  trust: mysqlEnum("trust", ["verified", "trusted", "caution"])
    .notNull()
    .default("caution"),
  affiliate: boolean("affiliate").notNull().default(false),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("stores_domain_idx").on(t.domain)]);

export const githubRepos = mysqlTable("github_repos", {
  id: pk(),
  owner: varchar("owner", { length: 100 }).notNull(),
  repo: varchar("repo", { length: 120 }).notNull(),
  lastSynced: datetime("last_synced"),
  cache: json("cache"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("github_repos_owner_repo_idx").on(t.owner, t.repo)]);

// ── Notificações ─────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: pk(),
  recipientId: bigint("recipient_id", { mode: "number" }).notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  payload: json("payload"),
  readAt: datetime("read_at"),
  emailedAt: datetime("emailed_at"), // digest de e-mail já enviado
  createdAt: createdAt(),
}, (t) => [index("notifications_recipient_idx").on(t.recipientId, t.readAt)]);

export const notificationPrefs = mysqlTable("notification_prefs", {
  id: pk(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  channel: mysqlEnum("channel", ["in_app", "email"]).notNull(),
  mode: mysqlEnum("mode", ["immediate", "daily_digest"])
    .notNull()
    .default("immediate"),
  enabled: boolean("enabled").notNull().default(true),
}, (t) => [
  uniqueIndex("notif_pref_idx").on(t.userId, t.type, t.channel),
]);

export const emailSuppressions = mysqlTable("email_suppressions", {
  email: varchar("email", { length: 255 }).primaryKey(),
  reason: varchar("reason", { length: 120 }).notNull(),
  at: createdAt(),
});

// ── Captcha proprietário (RetroGuard): nonces single-use ─────────────────
export const captchaNonces = mysqlTable("captcha_nonces", {
  nonce: varchar("nonce", { length: 64 }).primaryKey(),
  expiresAt: datetime("expires_at").notNull(),
}, (t) => [index("captcha_nonces_exp_idx").on(t.expiresAt)]);

// ── Auditoria ────────────────────────────────────────────────────────────
export const auditLog = mysqlTable("audit_log", {
  id: pk(),
  actorId: bigint("actor_id", { mode: "number" }),
  action: varchar("action", { length: 80 }).notNull(),
  target: varchar("target", { length: 120 }).notNull(),
  ip: varchar("ip", { length: 64 }),
  meta: json("meta"),
  createdAt: createdAt(),
}, (t) => [
  index("audit_actor_idx").on(t.actorId),
  index("audit_target_idx").on(t.target),
]);

// ── Conquistas: badges ───────────────────────────────────────────────────
export const badges = mysqlTable("badges", {
  id: pk(),
  slug: varchar("slug", { length: 80 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  description: varchar("description", { length: 300 }).notNull(),
  icon: varchar("icon", { length: 40 }).notNull().default("award"),
  image: varchar("image", { length: 500 }), // imagem custom (BunnyCDN); cai no ícone se vazio
  tier: mysqlEnum("tier", ["bronze", "silver", "gold"]).notNull().default("bronze"),
  sortOrder: int("sort_order").notNull().default(0),
  manuallyAwardable: boolean("manually_awardable").notNull().default(true),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("badges_slug_idx").on(t.slug)]);

export const userBadges = mysqlTable("user_badges", {
  id: pk(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  badgeId: bigint("badge_id", { mode: "number" }).notNull(),
  awardedAt: createdAt(),
}, (t) => [
  uniqueIndex("user_badge_idx").on(t.userId, t.badgeId),
  index("user_badges_user_idx").on(t.userId),
]);

// ── Permissões por papel (grupos) ────────────────────────────────────────
// Guarda as flags de permissão de cada papel como JSON. Os padrões ficam em
// código; o banco guarda as edições do admin.
export const rolePermissions = mysqlTable("role_permissions", {
  id: pk(),
  role: varchar("role", { length: 20 }).notNull(),
  permissions: json("permissions").notNull(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("role_permissions_role_idx").on(t.role)]);

// Regras de auto-promoção de papel por critérios.
export const promotionRules = mysqlTable("promotion_rules", {
  id: pk(),
  name: varchar("name", { length: 120 }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  criteria: json("criteria").notNull(),
  targetRole: varchar("target_role", { length: 20 }).notNull(),
  createdAt: createdAt(),
}, (t) => [index("promotion_rules_order_idx").on(t.sortOrder)]);

// ── Quests (missões) ─────────────────────────────────────────────────────
export const quests = mysqlTable("quests", {
  id: pk(),
  title: varchar("title", { length: 160 }).notNull(),
  description: varchar("description", { length: 2000 }).notNull().default(""),
  enabled: boolean("enabled").notNull().default(false),
  sortOrder: int("sort_order").notNull().default(0),
  rewardBadge: varchar("reward_badge", { length: 80 }), // slug da badge (opcional)
  coverImage: varchar("cover_image", { length: 500 }), // capa (BunnyCDN)
  startsAt: datetime("starts_at"), // janela de disponibilidade (opcional)
  endsAt: datetime("ends_at"),
  audienceRoles: json("audience_roles"), // string[] de papéis; vazio/null = todos
  allowOptOut: boolean("allow_opt_out").notNull().default(false),
  retroactive: boolean("retroactive").notNull().default(false),
  createdAt: createdAt(),
}, (t) => [index("quests_order_idx").on(t.sortOrder)]);

export const questOptOuts = mysqlTable("quest_opt_outs", {
  id: pk(),
  questId: bigint("quest_id", { mode: "number" }).notNull(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("quest_opt_out_idx").on(t.questId, t.userId)]);

export const questTasks = mysqlTable("quest_tasks", {
  id: pk(),
  questId: bigint("quest_id", { mode: "number" }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  description: varchar("description", { length: 1000 }).notNull().default(""),
  link: varchar("link", { length: 400 }),
  ruleId: bigint("rule_id", { mode: "number" }).notNull(), // achievement_rules.id
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("quest_tasks_quest_idx").on(t.questId), index("quest_tasks_rule_idx").on(t.ruleId)]);

export const questTaskCompletions = mysqlTable("quest_task_completions", {
  id: pk(),
  taskId: bigint("task_id", { mode: "number" }).notNull(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  completedAt: createdAt(),
}, (t) => [uniqueIndex("quest_task_completion_idx").on(t.taskId, t.userId)]);

// ── Campos de perfil customizados (Members > Profiles) ───────────────────

export const profileFieldGroups = mysqlTable("profile_field_groups", {
  id: pk(),
  name: varchar("name", { length: 120 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("pfg_order_idx").on(t.sortOrder)]);

export const profileFields = mysqlTable("profile_fields", {
  id: pk(),
  groupId: bigint("group_id", { mode: "number" }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  description: varchar("description", { length: 300 }).notNull().default(""),
  // text | textarea | editor | url | number | date | select | radio | checkboxset | yesno | color
  type: varchar("type", { length: 20 }).notNull().default("text"),
  options: json("options"), // string[] para select/radio/checkboxset
  required: boolean("required").notNull().default(false),
  maxLength: int("max_length"), // null = ilimitado
  regex: varchar("regex", { length: 255 }), // validação opcional
  showOnRegister: boolean("show_on_register").notNull().default(false),
  memberEditable: boolean("member_editable").notNull().default(true),
  // none | staff | staff_owner | all
  visibility: mysqlEnum("visibility", ["none", "staff", "staff_owner", "all"]).notNull().default("all"),
  pii: boolean("pii").notNull().default(false), // entra na exportação de dados pessoais
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("pf_group_idx").on(t.groupId), index("pf_order_idx").on(t.sortOrder)]);

export const profileFieldValues = mysqlTable("profile_field_values", {
  id: pk(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  fieldId: bigint("field_id", { mode: "number" }).notNull(),
  value: text("value"),
  updatedAt: createdAt(),
}, (t) => [uniqueIndex("pfv_user_field_idx").on(t.userId, t.fieldId)]);

export const questCompletions = mysqlTable("quest_completions", {
  id: pk(),
  questId: bigint("quest_id", { mode: "number" }).notNull(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  completedAt: createdAt(),
}, (t) => [uniqueIndex("quest_completion_idx").on(t.questId, t.userId)]);

// Anúncios do site (banner no topo, para todos).
export const announcements = mysqlTable("announcements", {
  id: pk(),
  message: varchar("message", { length: 500 }).notNull(),
  variant: mysqlEnum("variant", ["info", "warning", "success"]).notNull().default("info"),
  linkUrl: varchar("link_url", { length: 300 }).notNull().default(""),
  linkLabel: varchar("link_label", { length: 80 }).notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdById: bigint("created_by_id", { mode: "number" }),
  createdAt: createdAt(),
}, (t) => [index("announcements_active_idx").on(t.active)]);

// Galeria de fotos do membro (exibida no perfil público).
export const memberPhotos = mysqlTable("member_photos", {
  id: pk(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  caption: varchar("caption", { length: 200 }).notNull().default(""),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("member_photos_user_idx").on(t.userId, t.sortOrder)]);

// Pedidos de privacidade (LGPD): exclusão de conta solicitada pelo membro.
export const privacyRequests = mysqlTable("privacy_requests", {
  id: pk(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  type: mysqlEnum("type", ["deletion"]).notNull().default("deletion"),
  reason: varchar("reason", { length: 500 }).notNull().default(""),
  status: mysqlEnum("status", ["open", "completed", "rejected"]).notNull().default("open"),
  resolvedById: bigint("resolved_by_id", { mode: "number" }),
  resolvedAt: datetime("resolved_at"),
  createdAt: createdAt(),
}, (t) => [index("privacy_requests_status_idx").on(t.status)]);

// Indicações (referrals): quem indicou quem no cadastro.
export const referrals = mysqlTable("referrals", {
  id: pk(),
  referrerId: bigint("referrer_id", { mode: "number" }).notNull(),
  referredId: bigint("referred_id", { mode: "number" }).notNull(),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("referrals_referred_idx").on(t.referredId),
  index("referrals_referrer_idx").on(t.referrerId),
]);

// Log de e-mails em massa (bulk mail).
export const bulkMails = mysqlTable("bulk_mails", {
  id: pk(),
  subject: varchar("subject", { length: 200 }).notNull(),
  audience: varchar("audience", { length: 30 }).notNull(), // all | member | contributor | moderator | admin
  sentCount: int("sent_count").notNull().default(0),
  sentById: bigint("sent_by_id", { mode: "number" }),
  createdAt: createdAt(),
});

// Diretório da equipe (página pública): categorias e entradas.
export const staffCategories = mysqlTable("staff_categories", {
  id: pk(),
  title: varchar("title", { length: 120 }).notNull(),
  layout: mysqlEnum("layout", ["grid", "list", "twocol"]).notNull().default("grid"),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("staff_categories_order_idx").on(t.sortOrder)]);

export const staffEntries = mysqlTable("staff_entries", {
  id: pk(),
  categoryId: bigint("category_id", { mode: "number" }).notNull(),
  type: mysqlEnum("type", ["member", "group"]).notNull(),
  memberId: bigint("member_id", { mode: "number" }), // type=member
  groupRole: varchar("group_role", { length: 20 }), // type=group (papel)
  customName: varchar("custom_name", { length: 120 }).notNull().default(""),
  customTitle: varchar("custom_title", { length: 160 }).notNull().default(""),
  bio: text("bio"),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("staff_entries_cat_idx").on(t.categoryId, t.sortOrder)]);

// Equipes de moderação (grupos nomeados de membros) e atribuições de conteúdo.
export const modTeams = mysqlTable("mod_teams", {
  id: pk(),
  name: varchar("name", { length: 120 }).notNull(),
  createdAt: createdAt(),
});

export const modTeamMembers = mysqlTable("mod_team_members", {
  id: pk(),
  teamId: bigint("team_id", { mode: "number" }).notNull(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
}, (t) => [uniqueIndex("mod_team_member_idx").on(t.teamId, t.userId)]);

export const assignments = mysqlTable("assignments", {
  id: pk(),
  targetType: mysqlEnum("target_type", ["article"]).notNull().default("article"),
  targetId: bigint("target_id", { mode: "number" }).notNull(),
  assigneeType: mysqlEnum("assignee_type", ["user", "team"]).notNull(),
  assigneeId: bigint("assignee_id", { mode: "number" }).notNull(),
  note: varchar("note", { length: 500 }).notNull().default(""),
  status: mysqlEnum("status", ["open", "closed"]).notNull().default("open"),
  assignedById: bigint("assigned_by_id", { mode: "number" }),
  closedAt: datetime("closed_at"),
  createdAt: createdAt(),
}, (t) => [
  index("assignments_target_idx").on(t.targetType, t.targetId),
  index("assignments_status_idx").on(t.status),
]);

// Sistema de advertências (warnings): motivos, ações por limiar e registros.
export const warningReasons = mysqlTable("warning_reasons", {
  id: pk(),
  name: varchar("name", { length: 120 }).notNull(),
  points: int("points").notNull().default(1),
  removeAfterHours: int("remove_after_hours"), // null = nunca expira
  deductReputation: int("deduct_reputation").notNull().default(0),
  defaultNote: varchar("default_note", { length: 500 }).notNull().default(""),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("warning_reasons_order_idx").on(t.sortOrder)]);

export const warningActions = mysqlTable("warning_actions", {
  id: pk(),
  points: int("points").notNull(), // limiar de pontos ativos
  restrictHours: int("restrict_hours").notNull().default(0), // 0 = nenhum, -1 = indefinido
  banHours: int("ban_hours").notNull().default(0),
  moderateHours: int("moderate_hours").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("warning_actions_points_idx").on(t.points)]);

export const userWarnings = mysqlTable("user_warnings", {
  id: pk(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  reasonId: bigint("reason_id", { mode: "number" }),
  reasonName: varchar("reason_name", { length: 120 }).notNull().default(""),
  points: int("points").notNull().default(0),
  note: varchar("note", { length: 500 }).notNull().default(""),
  issuedById: bigint("issued_by_id", { mode: "number" }),
  acknowledged: boolean("acknowledged").notNull().default(false),
  expiresAt: datetime("expires_at"), // null = nunca
  createdAt: createdAt(),
}, (t) => [index("user_warnings_user_idx").on(t.userId)]);

// Desafio Pergunta & Resposta no cadastro (anti-bot).
export const spamQuestions = mysqlTable("spam_questions", {
  id: pk(),
  question: varchar("question", { length: 255 }).notNull(),
  answers: json("answers").notNull(), // string[] de respostas aceitas
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("spam_questions_order_idx").on(t.sortOrder)]);

// Regras de geolocalização no cadastro (por país: moderar ou bloquear).
export const geoRules = mysqlTable("geo_rules", {
  id: pk(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  action: mysqlEnum("action", ["flag", "block"]).notNull().default("flag"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("geo_rules_country_idx").on(t.countryCode)]);

// Tipos de denúncia (motivos selecionáveis) + textos de notificação ao autor.
export const reportTypes = mysqlTable("report_types", {
  id: pk(),
  title: varchar("title", { length: 120 }).notNull(),
  completedNotification: text("completed_notification"),
  rejectedNotification: text("rejected_notification"),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("report_types_order_idx").on(t.sortOrder)]);

// Denúncias de conteúdo (guia ou comentário) por membros.
export const contentReports = mysqlTable("content_reports", {
  id: pk(),
  reporterId: bigint("reporter_id", { mode: "number" }).notNull(),
  targetType: mysqlEnum("target_type", ["article", "comment"]).notNull(),
  targetId: bigint("target_id", { mode: "number" }).notNull(),
  reportTypeId: bigint("report_type_id", { mode: "number" }).notNull(),
  message: varchar("message", { length: 1000 }).notNull().default(""),
  status: mysqlEnum("status", ["open", "completed", "rejected"]).notNull().default("open"),
  resolvedById: bigint("resolved_by_id", { mode: "number" }),
  resolvedAt: datetime("resolved_at"),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("content_reports_unique_idx").on(t.reporterId, t.targetType, t.targetId),
  index("content_reports_target_idx").on(t.targetType, t.targetId),
  index("content_reports_status_idx").on(t.status),
]);

// Filtros de banimento (por e-mail, IP ou nome; aceita curinga *).
export const banFilters = mysqlTable("ban_filters", {
  id: pk(),
  type: mysqlEnum("type", ["email", "ip", "name"]).notNull(),
  content: varchar("content", { length: 255 }).notNull(),
  reason: varchar("reason", { length: 255 }).notNull().default(""),
  actorId: bigint("actor_id", { mode: "number" }),
  createdAt: createdAt(),
}, (t) => [index("ban_filters_type_idx").on(t.type)]);

// Cache de geolocalização por IP (via ipwho.is). Evita repetir chamadas.
export const ipGeo = mysqlTable("ip_geo", {
  id: pk(),
  ip: varchar("ip", { length: 45 }).notNull(),
  label: varchar("label", { length: 160 }).notNull().default(""),
  fetchedAt: createdAt(),
}, (t) => [uniqueIndex("ip_geo_ip_idx").on(t.ip)]);

// Configurações da plataforma (chave/valor JSON). Genérico e reusável.
export const appSettings = mysqlTable("app_settings", {
  id: pk(),
  key: varchar("key", { length: 60 }).notNull(),
  value: json("value").notNull(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("app_settings_key_idx").on(t.key)]);

// Ranks (níveis por reputação), editáveis. Seed com os 13 padrões de ranks.ts.
export const ranks = mysqlTable("ranks", {
  id: pk(),
  title: varchar("title", { length: 80 }).notNull(),
  points: int("points").notNull().default(0), // limiar de reputação
  icon: varchar("icon", { length: 40 }).notNull().default("Shield"),
  image: varchar("image", { length: 500 }), // imagem custom (BunnyCDN)
  sortOrder: int("sort_order").notNull().default(0),
}, (t) => [index("ranks_points_idx").on(t.points)]);

// Regras de conquista (motor When/Then): um gatilho concede pontos e/ou badges
// a destinatários, com condição opcional de marco (a N-ésima ação).
export const achievementRules = mysqlTable("achievement_rules", {
  id: pk(),
  name: varchar("name", { length: 120 }).notNull(),
  trigger: varchar("trigger", { length: 40 }).notNull(),
  milestone: int("milestone").notNull().default(0), // 0 = toda vez; N = só na N-ésima
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  rewards: json("rewards").notNull(), // { actor:{points,badge}, target:{points,badge} }
  createdAt: createdAt(),
}, (t) => [index("achievement_rules_trigger_idx").on(t.trigger)]);

// Páginas montadas no construtor visual (admin). O layout é uma árvore segura
// (seções → colunas → widgets) serializada em JSON, validada por allowlist.
export const pages = mysqlTable("pages", {
  id: pk(),
  slug: varchar("slug", { length: 160 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  metaDescription: varchar("meta_description", { length: 320 }),
  layout: json("layout").notNull(), // { sections: [...] }
  status: mysqlEnum("status", ["draft", "published"]).notNull().default("draft"),
  showInMenu: boolean("show_in_menu").notNull().default(false),
  menuOrder: int("menu_order").notNull().default(0),
  noindex: boolean("noindex").notNull().default(false),
  createdById: bigint("created_by_id", { mode: "number" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("pages_slug_idx").on(t.slug), index("pages_menu_idx").on(t.showInMenu, t.menuOrder)]);

// Blocos reutilizáveis do construtor: uma seção salva (árvore segura) para
// reaproveitar em outras páginas.
export const pageBlocks = mysqlTable("page_blocks", {
  id: pk(),
  name: varchar("name", { length: 120 }).notNull(),
  layout: json("layout").notNull(), // uma Section serializada
  createdById: bigint("created_by_id", { mode: "number" }),
  createdAt: createdAt(),
}, (t) => [index("page_blocks_name_idx").on(t.name)]);

// Tipos exportados --------------------------------------------------------
export type UserRole = (typeof users.$inferSelect)["role"];
export type User = typeof users.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type DeviceSpec = typeof deviceSpecs.$inferSelect;
export type Article = typeof articles.$inferSelect;
