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
import { checkRateLimit } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

const CreateSchema = z.object({
  title: z.string().min(8, "Título muito curto (mínimo 8 caracteres).").max(140),
  type: z.enum(["tutorial", "buying_guide", "troubleshooting", "firmware", "general"]),
  deviceId: z.number().int().positive().nullable().optional(),
  body: BlockTreeSchema,
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
  const { title, type, deviceId, body } = parsed.data;
  const slug = `${slugify(title).slice(0, 80)}-${nanoid(6).toLowerCase()}`;

  const [res] = await db.insert(articles).values({
    slug,
    type,
    title,
    deviceId: deviceId ?? null,
    authorId: Number(user.id),
    status: "draft",
    searchText: blockTreeToText(body),
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
    revalidatePath("/guias");
    revalidatePath(`/guias/${article.slug}`);
  }
  return { ok: true };
}
