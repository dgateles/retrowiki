"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import { articles, revisions, reviews, users, auditLog } from "@/db/schema";
import { createNotification } from "@/lib/notifications";
import { postingGate, isContentModerated } from "@/lib/warnings";
import { requireUser, requireRole } from "@/lib/auth-helpers";
import { BlockTreeSchema } from "@/lib/blocks/schema";
import { blockTreeToText } from "@/lib/blocks/schema";
import { RichDocSchema, isRichDoc, richDocToText } from "@/lib/blocks/rich-schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { evaluateBadges } from "@/lib/badges";
import { runTrigger } from "@/lib/achievements";
import { canPublishDirectly } from "@/lib/permissions";

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

type Result<T = unknown> = { ok: boolean; error?: string; message?: string; data?: T };

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

/** Edição de um artigo JÁ PUBLICADO: cria uma nova revisão pendente sem derrubar
 * a versão no ar. A troca só ocorre quando um moderador aprova. */
export async function proposeEditAction(articleId: number, input: unknown): Promise<Result> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }
  const rl = await checkRateLimit(`propose:${user.id}`, 10, 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas ações. Aguarde um momento." };

  const gate = await postingGate(Number(user.id));
  if (!gate.ok) return { ok: false, error: gate.error };

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const [article] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  if (!article) return { ok: false, error: "Conteúdo não encontrado." };
  if (article.authorId !== Number(user.id)) return { ok: false, error: "Sem permissão." };
  if (article.status !== "published") return { ok: false, error: "Use o fluxo de rascunho para conteúdo não publicado." };

  const checked = validateBody(parsed.data.body);
  if (!checked.ok) return { ok: false, error: checked.error };

  // Nova revisão (não vira a corrente) + review pendente para a fila.
  const [rev] = await db.insert(revisions).values({ articleId, body: checked.body, editorId: Number(user.id) });
  const revisionId = (rev as unknown as { insertId: number }).insertId;
  await db.insert(reviews).values({ revisionId, decision: "pending" });

  return { ok: true, message: "Alteração enviada para revisão. A versão atual continua no ar até a aprovação." };
}

export async function submitForReviewAction(articleId: number): Promise<Result> {
  let session;
  try {
    session = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }

  const gate = await postingGate(Number(session.id));
  if (!gate.ok) return { ok: false, error: gate.error };

  const [article] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  if (!article) return { ok: false, error: "Artigo não encontrado." };
  if (article.authorId !== Number(session.id)) return { ok: false, error: "Sem permissão." };
  if (!article.currentRevisionId) return { ok: false, error: "Rascunho vazio." };

  const [user] = await db.select().from(users).where(eq(users.id, Number(session.id))).limit(1);

  // Advertência "moderar conteúdo": força revisão mesmo p/ quem publica direto.
  const moderated = await isContentModerated(Number(session.id));

  // autotrust: publica direto, mas registra Review automático (auditável)
  if (!moderated && (await canPublishDirectly(user ?? null))) {
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
    await runTrigger("guide.published", { actorId: article.authorId });
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

  // Edição proposta sobre um artigo já publicado: a versão no ar permanece;
  // recusar/pedir ajustes NÃO derruba o conteúdo, só descarta a proposta.
  const isProposalOnLive = article.status === "published" && article.currentRevisionId !== rev.id;

  if (decision === "approved") {
    await db.update(articles).set({ status: "published", currentRevisionId: rev.id, publishedAt: article.publishedAt ?? new Date() }).where(eq(articles.id, article.id));
  } else if (!isProposalOnLive) {
    const status = decision === "rejected" ? "rejected" : "changes_requested";
    await db.update(articles).set({ status }).where(eq(articles.id, article.id));
  }
  // se isProposalOnLive e não aprovado: nada muda no artigo (segue publicado).

  await db.insert(auditLog).values({
    actorId: Number(mod.id),
    action: `moderate_${decision}`,
    target: `article:${article.id}`,
  });

  // notificação in-app ao autor (respeita preferências)
  await createNotification(article.authorId, `article.${decision}`, {
    articleId: article.id,
    slug: article.slug,
    title: article.title,
    reason,
  });

  if (decision === "approved") {
    await evaluateBadges(article.authorId);
    await runTrigger("guide.published", { actorId: article.authorId });
    revalidatePath("/guias");
    revalidatePath(`/guias/${article.slug}`);
  }
  return { ok: true };
}

// ── Gestão de artigos (admin): mudar status / excluir ──────────────────────

const ADMIN_STATUSES = ["published", "archived", "rejected", "draft"];

export async function setArticleStatusAction(articleId: number, status: string): Promise<Result> {
  let actor;
  try {
    actor = await requireRole("admin");
  } catch {
    return { ok: false, error: "Acesso restrito." };
  }
  if (!ADMIN_STATUSES.includes(status)) return { ok: false, error: "Status inválido." };
  const [article] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  if (!article) return { ok: false, error: "Artigo não encontrado." };
  if (status === "published" && !article.currentRevisionId) return { ok: false, error: "Sem revisão para publicar." };

  await db.update(articles).set({
    status: status as "published" | "archived" | "rejected" | "draft",
    ...(status === "published" && !article.publishedAt ? { publishedAt: new Date() } : {}),
  }).where(eq(articles.id, articleId));

  const { logModAction } = await import("@/lib/panel");
  await logModAction(Number(actor.id), `article_set_${status}`, `article:${articleId}`);
  revalidatePath("/admin/artigos");
  revalidatePath("/guias");
  revalidatePath(`/guias/${article.slug}`);
  return { ok: true };
}

export async function deleteArticleAction(articleId: number): Promise<Result> {
  let actor;
  try {
    actor = await requireRole("admin");
  } catch {
    return { ok: false, error: "Acesso restrito." };
  }
  const [article] = await db.select({ slug: articles.slug }).from(articles).where(eq(articles.id, articleId)).limit(1);
  if (!article) return { ok: false, error: "Artigo não encontrado." };
  const { deleteArticleCompletely } = await import("@/lib/admin/articles");
  if (!(await deleteArticleCompletely(articleId))) return { ok: false, error: "Falha ao excluir." };
  const { logModAction } = await import("@/lib/panel");
  await logModAction(Number(actor.id), "article_delete", `article:${articleId}`);
  revalidatePath("/admin/artigos");
  revalidatePath("/guias");
  return { ok: true };
}
