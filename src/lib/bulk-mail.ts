import "server-only";
import { and, eq, isNull, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, bulkMails } from "@/db/schema";
import { sendEmail } from "@/lib/email/mailer";

export type Audience = "all" | "member" | "contributor" | "moderator" | "admin";
const ROLES = ["member", "contributor", "moderator", "admin"];

/** Destinatários da audiência, excluindo opt-out e contas anonimizadas. */
async function recipientsFor(audience: Audience): Promise<{ email: string; name: string }[]> {
  const conds = [eq(users.bulkMailOptOut, false), isNull(users.deletedAt)];
  if (audience !== "all") conds.push(eq(users.role, audience as "member" | "contributor" | "moderator" | "admin"));
  const rows = await db.select({ email: users.email, name: users.displayName }).from(users).where(and(...conds));
  return rows.filter((r) => r.email && /@/.test(r.email) && !r.email.endsWith("@retrowiki.invalid"));
}

export async function sendBulkMail(subject: string, bodyHtml: string, audience: Audience, sentById: number): Promise<{ ok: boolean; sent: number; error?: string }> {
  if (!ROLES.includes(audience) && audience !== "all") return { ok: false, sent: 0, error: "Audiência inválida." };
  if (subject.trim().length < 1 || bodyHtml.trim().length < 1) return { ok: false, sent: 0, error: "Assunto e corpo são obrigatórios." };

  const recipients = await recipientsFor(audience);
  let sent = 0;
  const text = bodyHtml.replace(/<[^>]+>/g, "");
  for (const r of recipients) {
    try {
      await sendEmail({ to: r.email, subject, html: bodyHtml, text });
      sent += 1;
    } catch {
      // segue para o próximo
    }
  }

  await db.insert(bulkMails).values({ subject: subject.slice(0, 200), audience, sentCount: sent, sentById });
  return { ok: true, sent };
}

export type BulkMailRow = { id: number; subject: string; audience: string; sentCount: number; createdAt: Date };

export async function listBulkMails(limit = 20): Promise<BulkMailRow[]> {
  try {
    const rows = await db.select({ id: bulkMails.id, subject: bulkMails.subject, audience: bulkMails.audience, sentCount: bulkMails.sentCount, createdAt: bulkMails.createdAt }).from(bulkMails).orderBy(desc(bulkMails.createdAt)).limit(limit);
    return rows;
  } catch {
    return [];
  }
}

/** Quantos membros receberiam (prévia da audiência). */
export async function audienceSize(audience: Audience): Promise<number> {
  try {
    return (await recipientsFor(audience)).length;
  } catch {
    return 0;
  }
}

export async function setBulkMailOptOut(userId: number, optOut: boolean): Promise<void> {
  try {
    await db.update(users).set({ bulkMailOptOut: optOut }).where(eq(users.id, userId));
  } catch {
    // best-effort
  }
}
