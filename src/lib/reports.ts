import "server-only";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { reportTypes, contentReports, articles, comments, users } from "@/db/schema";
import { getReportingSettings } from "@/lib/settings";
import { createNotification } from "@/lib/notifications";

export type TargetType = "article" | "comment";
export type ReportType = { id: number; title: string; completedNotification: string; rejectedNotification: string; sortOrder: number };

const DEFAULT_TYPES = [
  { title: "Ofensivo / Abusivo", sortOrder: 1 },
  { title: "Spam", sortOrder: 2 },
  { title: "Off-topic / Irrelevante", sortOrder: 3 },
];

let seeded = false;
export async function ensureReportTypes(): Promise<void> {
  if (seeded) return;
  try {
    const [row] = await db.select({ id: reportTypes.id }).from(reportTypes).limit(1);
    if (!row) await db.insert(reportTypes).values(DEFAULT_TYPES);
    seeded = true;
  } catch {
    // ignora
  }
}

function rowToType(r: typeof reportTypes.$inferSelect): ReportType {
  return { id: r.id, title: r.title, completedNotification: r.completedNotification ?? "", rejectedNotification: r.rejectedNotification ?? "", sortOrder: r.sortOrder };
}

export async function listReportTypes(): Promise<ReportType[]> {
  await ensureReportTypes();
  try {
    const rows = await db.select().from(reportTypes).orderBy(asc(reportTypes.sortOrder), asc(reportTypes.id));
    return rows.map(rowToType);
  } catch {
    return [];
  }
}

export async function getReportType(id: number): Promise<ReportType | null> {
  try {
    const [r] = await db.select().from(reportTypes).where(eq(reportTypes.id, id)).limit(1);
    return r ? rowToType(r) : null;
  } catch {
    return null;
  }
}

export type ReportTypeInput = { title: string; completedNotification: string; rejectedNotification: string };

export async function createReportType(input: ReportTypeInput): Promise<number | null> {
  try {
    await ensureReportTypes();
    const all = await db.select({ s: reportTypes.sortOrder }).from(reportTypes);
    const sortOrder = Math.max(0, ...all.map((r) => r.s)) + 1;
    const [res] = await db.insert(reportTypes).values({ ...input, sortOrder });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function updateReportType(id: number, input: ReportTypeInput): Promise<boolean> {
  try {
    await db.update(reportTypes).set(input).where(eq(reportTypes.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deleteReportType(id: number): Promise<boolean> {
  try {
    await db.delete(reportTypes).where(eq(reportTypes.id, id));
    return true;
  } catch {
    return false;
  }
}

// ── Denúncias ──────────────────────────────────────────────────────────────

async function contentAuthorId(targetType: TargetType, targetId: number): Promise<number | null> {
  try {
    if (targetType === "article") {
      const [a] = await db.select({ id: articles.authorId }).from(articles).where(eq(articles.id, targetId)).limit(1);
      return a?.id ?? null;
    }
    const [c] = await db.select({ id: comments.authorId }).from(comments).where(eq(comments.id, targetId)).limit(1);
    return c?.id ?? null;
  } catch {
    return null;
  }
}

async function hideContent(targetType: TargetType, targetId: number): Promise<void> {
  if (targetType === "article") {
    await db.update(articles).set({ status: "archived" }).where(eq(articles.id, targetId));
  } else {
    await db.update(comments).set({ status: "hidden" }).where(eq(comments.id, targetId));
  }
}

export type ReportResult = { ok: boolean; error?: string };

/** Cria uma denúncia. Aplica auto-moderação por limiar se ativa. */
export async function createReport(reporterId: number, targetType: TargetType, targetId: number, reportTypeId: number, message: string): Promise<ReportResult> {
  try {
    const author = await contentAuthorId(targetType, targetId);
    if (author === null) return { ok: false, error: "Conteúdo não encontrado." };
    if (author === reporterId) return { ok: false, error: "Você não pode denunciar o próprio conteúdo." };

    const settings = await getReportingSettings();
    if (settings.messageMandatory && message.trim().length === 0) {
      return { ok: false, error: "A mensagem é obrigatória." };
    }
    const type = await getReportType(reportTypeId);
    if (!type) return { ok: false, error: "Motivo inválido." };

    await db
      .insert(contentReports)
      .values({ reporterId, targetType, targetId, reportTypeId, message: message.trim().slice(0, 1000), status: "open" })
      .onDuplicateKeyUpdate({ set: { reportTypeId, message: message.trim().slice(0, 1000), status: "open" } });

    // Auto-moderação: oculta se atingir o limiar de denunciantes únicos abertos.
    if (settings.autoModEnabled) {
      const [c] = await db
        .select({ n: count() })
        .from(contentReports)
        .where(and(eq(contentReports.targetType, targetType), eq(contentReports.targetId, targetId), eq(contentReports.status, "open")));
      const unique = Number(c?.n ?? 0);

      // Limiar efetivo: autores que NÃO satisfazem o critério de confiança usam
      // o limiar (menor) de "não confiável".
      let threshold = settings.autoModThreshold;
      if (settings.trustedAutoMod) {
        const { sanitizeCriteria, memberMatchesCriteria } = await import("@/lib/admin/promotions");
        const trusted = await memberMatchesCriteria(author, sanitizeCriteria(settings.trustedCriteria));
        if (!trusted) threshold = settings.untrustedThreshold;
      }

      if (unique >= threshold) {
        await hideContent(targetType, targetId);
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao denunciar." };
  }
}

export type ReportGroup = {
  targetType: TargetType;
  targetId: number;
  title: string;
  link: string | null;
  authorId: number | null;
  reportCount: number;
  reasons: string[];
  lastMessage: string;
};

/** Fila de denúncias abertas, agrupadas por conteúdo. */
export async function getReportQueue(): Promise<ReportGroup[]> {
  try {
    const rows = await db
      .select({
        targetType: contentReports.targetType,
        targetId: contentReports.targetId,
        reportTypeId: contentReports.reportTypeId,
        message: contentReports.message,
        createdAt: contentReports.createdAt,
      })
      .from(contentReports)
      .where(eq(contentReports.status, "open"))
      .orderBy(desc(contentReports.createdAt));
    if (rows.length === 0) return [];

    const types = new Map((await listReportTypes()).map((t) => [t.id, t.title]));
    const groups = new Map<string, ReportGroup>();
    for (const r of rows) {
      const key = `${r.targetType}:${r.targetId}`;
      let g = groups.get(key);
      if (!g) {
        g = { targetType: r.targetType as TargetType, targetId: r.targetId, title: "", link: null, authorId: null, reportCount: 0, reasons: [], lastMessage: r.message };
        groups.set(key, g);
      }
      g.reportCount += 1;
      const reason = types.get(r.reportTypeId) ?? "Outro";
      if (!g.reasons.includes(reason)) g.reasons.push(reason);
    }

    // Enriquecer com título/link/autor do conteúdo.
    const articleIds = [...groups.values()].filter((g) => g.targetType === "article").map((g) => g.targetId);
    const commentIds = [...groups.values()].filter((g) => g.targetType === "comment").map((g) => g.targetId);
    if (articleIds.length) {
      const arts = await db.select({ id: articles.id, slug: articles.slug, title: articles.title, authorId: articles.authorId }).from(articles).where(inArray(articles.id, articleIds));
      for (const a of arts) {
        const g = groups.get(`article:${a.id}`);
        if (g) { g.title = a.title; g.link = `/guias/${a.slug}`; g.authorId = a.authorId; }
      }
    }
    if (commentIds.length) {
      const cms = await db.select({ id: comments.id, body: comments.body, userId: comments.authorId, articleId: comments.articleId }).from(comments).where(inArray(comments.id, commentIds));
      const artMap = new Map<number, string>();
      const aIds = [...new Set(cms.map((c) => c.articleId))];
      if (aIds.length) {
        const arts = await db.select({ id: articles.id, slug: articles.slug }).from(articles).where(inArray(articles.id, aIds));
        for (const a of arts) artMap.set(a.id, a.slug);
      }
      for (const c of cms) {
        const g = groups.get(`comment:${c.id}`);
        if (g) {
          g.title = `Comentário: ${String(c.body ?? "").slice(0, 80)}`;
          const slug = artMap.get(c.articleId);
          g.link = slug ? `/guias/${slug}#comentario-${c.id}` : null;
          g.authorId = c.userId;
        }
      }
    }
    return [...groups.values()].sort((a, b) => b.reportCount - a.reportCount);
  } catch {
    return [];
  }
}

export async function getOpenReportCount(): Promise<number> {
  try {
    const [c] = await db.select({ n: sql<number>`COUNT(DISTINCT CONCAT(${contentReports.targetType}, ${contentReports.targetId}))` }).from(contentReports).where(eq(contentReports.status, "open"));
    return Number(c?.n ?? 0);
  } catch {
    return 0;
  }
}

function applyTags(template: string, vars: { name: string; content: string; link: string; reason: string }): string {
  return template
    .replaceAll("{name}", vars.name)
    .replaceAll("{content}", vars.content)
    .replaceAll("{link}", vars.link)
    .replaceAll("{reason}", vars.reason);
}

/** Resolve as denúncias de um conteúdo (completed → oculta; rejected → mantém). */
export async function resolveReports(targetType: TargetType, targetId: number, decision: "completed" | "rejected", modId: number): Promise<ReportResult> {
  try {
    const reps = await db.select().from(contentReports).where(and(eq(contentReports.targetType, targetType), eq(contentReports.targetId, targetId), eq(contentReports.status, "open")));
    if (reps.length === 0) return { ok: false, error: "Nenhuma denúncia aberta." };

    await db
      .update(contentReports)
      .set({ status: decision, resolvedById: modId, resolvedAt: new Date() })
      .where(and(eq(contentReports.targetType, targetType), eq(contentReports.targetId, targetId), eq(contentReports.status, "open")));

    if (decision === "completed") await hideContent(targetType, targetId);

    // Notifica o autor (sino) e e-mail conforme o template do tipo, se houver.
    const author = await contentAuthorId(targetType, targetId);
    if (author) {
      await createNotification(author, "report.resolved", { decision });
      const type = await getReportType(reps[0].reportTypeId);
      const template = decision === "completed" ? type?.completedNotification : type?.rejectedNotification;
      if (template && template.trim()) {
        try {
          const { sendEmail } = await import("@/lib/email/mailer");
          const [u] = await db.select({ email: users.email, name: users.displayName }).from(users).where(eq(users.id, author)).limit(1);
          if (u) {
            const reason = type?.title ?? "denúncia";
            const text = applyTags(template, { name: u.name, content: "", link: "", reason });
            await sendEmail({ to: u.email, subject: "Sobre seu conteúdo na RetroWiki", html: text.replace(/\n/g, "<br>"), text });
          }
        } catch {
          /* e-mail é best-effort */
        }
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao resolver." };
  }
}
