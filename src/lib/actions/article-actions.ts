"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import { articles, revisions, reviews, users, notifications, auditLog } from "@/db/schema";
import { requireUser, requireRole, can } from "@/lib/auth-helpers";
import { BlockTreeSchema } from "@/lib/blocks/schema";
import { blockTreeToText } from "@/lib/blocks/schema";
import { RichDocSchema, isRichDoc, richDocToText } from "@/lib/blocks/rich-schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { evaluateBadges } from "@/lib/badges";

// Aceita o corpo no formato novo (editor rico, type: "doc") ou no antigo
// (árvore de blocos). O corpo chega como string JSON, serializado no cliente
// para passar limpo pela fronteira do Server Action (objetos do editor viram
// "client references" e quebram o acesso no servidor). Valida por allowlist.
function validateBody(
  raw: unknown,
): { ok: true; body: unknown; searchText: string } | { ok: false; error: string } {
  if (typeof raw !== "string" || raw.length > 2_000_000) return { ok: false, error: "Conteúdo inválido." };
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Conteúdo inválido." };
  }
  if (isRichDoc(body)) {
    const r = RichDocSchema.safeParse(body);
    if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? "Conteúdo inválido." };
    return { ok: true, body: r.data, searchText: richDocToText(r.data) };
  }
  const b = BlockTreeSchema.safeParse(body);
  if (!b.success) return { ok: false, error: b.error.issues[0]?.message ?? "Conteúdo inválido." };
  return { ok: true, body: b.data, searchText: blockTreeToText(b.data) };
}
import { slugify } from "@/lib/utils";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

const CreateSchema = z.object({
  title: z.string().min(8, "Título muito curto (mínimo 8 caracteres).").max(140),
  type: z.enum(["tutorial", "buying_guide", "troubleshooting", "firmware", "general"]),
  deviceId: z.number().int().positive().nullable().optional(),
  body: z.unknown(),
});

export async function createDraftAction(input: unknown): Promise<Result<{ id: number }>> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login para criar conteúdo." };
  }
  const rl = await checkRateLimit(`draft:${user.id}`, 20, 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas ações. Aguarde um momento." };

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { title, type, deviceId } = parsed.data;
  const checked = validateBody(parsed.data.body);
  if (!checked.ok) return { ok: false, error: checked.error };
  const { body, searchText } = checked;
  const slug = `${slugify(title).slice(0, 80)}-${nanoid(6).toLowerCase()}`;

  const [res] = await db.insert(articles).values({
    slug,
    type,
    title,
    deviceId: deviceId ?? null,
    authorId: Number(user.id),
    status: "draft",
    searchText,
  });
  const articleId = (res as unknown as { insertId: number }).insertId;

  const [rev] = await db.insert(revisions).values({
    articleId,
    body,
    editorId: Number(user.id),
  });
  const revisionId = (rev as unknown as { insertId: number }).insertId;
  await db.update(articles).set({ currentRevisionId: revisionId }).where(eq(articles.id, articleId));

  return { ok: true, data: { id: articleId } };
}

const EDITABLE = new Set(["draft", "changes_requested", "rejected", "pending"]);

export async function updateDraftAction(articleId: number, input: unknown): Promise<Result<{ id: number }>> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }
  const rl = await checkRateLimit(`draft:${user.id}`, 20, 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas ações. Aguarde um momento." };

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const [article] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  if (!article) return { ok: false, error: "Conteúdo não encontrado." };
  if (article.authorId !== Number(user.id)) return { ok: false, error: "Sem permissão." };
  if (!EDITABLE.has(article.status)) {
    return { ok: false, error: "Conteúdo publicado não pode ser editado por aqui." };
  }

  const { title, type, deviceId } = parsed.data;
  const checked = validateBody(parsed.data.body);
  if (!checked.ok) return { ok: false, error: checked.error };
  const { body, searchText } = checked;
  const [rev] = await db.insert(revisions).values({
    articleId,
    body,
    editorId: Number(user.id),
  });
  const revisionId = (rev as unknown as { insertId: number }).insertId;

  await db
    .update(articles)
    .set({
      title,
      type,
      deviceId: deviceId ?? null,
      currentRevisionId: revisionId,
      searchText,
      status: "draft",
    })
    .where(eq(articles.id, articleId));

  return { ok: true, data: { id: articleId } };
}

export async function submitForReviewAction(articleId: number): Promise<Result> {
  let session;
  try {
    session = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }

  const [article] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  if (!article) return { ok: false, error: "Artigo não encontrado." };
  if (article.authorId !== Number(session.id)) return { ok: false, error: "Sem permissão." };
  if (!article.currentRevisionId) return { ok: false, error: "Rascunho vazio." };

  const [user] = await db.select().from(users).where(eq(users.id, Number(session.id))).limit(1);

  // autotrust: publica direto, mas registra Review automático (auditável)
  if (can.publishDirectly(user ?? null)) {
    await db.insert(reviews).values({
      revisionId: article.currentRevisionId,
      reviewerId: Number(session.id),
      decision: "approved",
      reason: "autotrust",
    });
    await db
      .update(articles)
      .set({ status: "published", publishedAt: new Date() })
      .where(eq(articles.id, articleId));
    await evaluateBadges(article.authorId);
    revalidatePath("/guias");
    revalidatePath(`/guias/${article.slug}`);
    return { ok: true };
  }

  await db.insert(reviews).values({
    revisionId: article.currentRevisionId,
    decision: "pending",
  });
  await db.update(articles).set({ status: "pending" }).where(eq(articles.id, articleId));
  return { ok: true };
}

const ModerateSchema = z.object({
  reviewId: z.number().int().positive(),
  decision: z.enum(["approved", "changes_requested", "rejected"]),
  reason: z.string().max(500).optional(),
});

export async function moderateAction(input: unknown): Promise<Result> {
  let mod;
  try {
    mod = await requireRole("moderator");
  } catch {
    return { ok: false, error: "Apenas moderadores." };
  }
  const parsed = ModerateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };
  const { reviewId, decision, reason } = parsed.data;

  const [review] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  if (!review || review.decision !== "pending") {
    return { ok: false, error: "Revisão não está pendente." };
  }
  const [rev] = await db.select().from(revisions).where(eq(revisions.id, review.revisionId)).limit(1);
  if (!rev) return { ok: false, error: "Revisão não encontrada." };
  const [article] = await db.select().from(articles).where(eq(articles.id, rev.articleId)).limit(1);
  if (!article) return { ok: false, error: "Artigo não encontrado." };

  await db
    .update(reviews)
    .set({ decision, reviewerId: Number(mod.id), reason: reason ?? null })
    .where(eq(reviews.id, reviewId));

  const status =
    decision === "approved" ? "published" : decision === "rejected" ? "rejected" : "changes_requested";
  await db
    .update(articles)
    .set({
      status,
      ...(decision === "approved"
        ? { currentRevisionId: rev.id, publishedAt: new Date() }
        : {}),
    })
    .where(eq(articles.id, article.id));

  await db.insert(auditLog).values({
    actorId: Number(mod.id),
    action: `moderate_${decision}`,
    target: `article:${article.id}`,
  });

  // notificação in-app ao autor
  await db
    .insert(notifications)
    .values({
      recipientId: article.authorId,
      type: `article.${decision}`,
      payload: { articleId: article.id, slug: article.slug, title: article.title, reason },
    })
    .catch(() => {});

  if (decision === "approved") {
    await evaluateBadges(article.authorId);
    revalidatePath("/guias");
    revalidatePath(`/guias/${article.slug}`);
  }
  return { ok: true };
}
