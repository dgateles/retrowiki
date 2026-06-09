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
    reputation: int("reputation").notNull().default(0),
    trusted: boolean("trusted").notNull().default(false),
    isSuspended: boolean("is_suspended").notNull().default(false),
    emailVerifiedAt: datetime("email_verified_at"),
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
    type: mysqlEnum("type", [
      "tutorial",
      "buying_guide",
      "troubleshooting",
      "firmware",
      "general",
    ]).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    summary: varchar("summary", { length: 320 }),
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
  value: int("value").notNull().default(1),
}, (t) => [uniqueIndex("votes_user_article_idx").on(t.userId, t.articleId)]);

// Visualizações únicas: uma linha por (artigo, visitante). viewerKey = usuário
// logado ou hash do IP. Alimenta articles.views_count.
export const articleViews = mysqlTable("article_views", {
  id: pk(),
  articleId: bigint("article_id", { mode: "number" }).notNull(),
  viewerKey: varchar("viewer_key", { length: 64 }).notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("article_views_article_viewer_idx").on(t.articleId, t.viewerKey)]);

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
  tier: mysqlEnum("tier", ["bronze", "silver", "gold"]).notNull().default("bronze"),
  sortOrder: int("sort_order").notNull().default(0),
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

// Tipos exportados --------------------------------------------------------
export type UserRole = (typeof users.$inferSelect)["role"];
export type User = typeof users.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type DeviceSpec = typeof deviceSpecs.$inferSelect;
export type Article = typeof articles.$inferSelect;
