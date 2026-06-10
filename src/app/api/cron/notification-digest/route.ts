import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { and, isNull, inArray, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { env } from "@/lib/env";
import { isEmailAllowed } from "@/lib/notifications-prefs";
import { describeNotification } from "@/lib/notification-text";
import { sendEmail } from "@/lib/email/mailer";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  if (!env.CRON_SECRET) return false;
  const got = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
}

/**
 * Digest de e-mail das notificações não lidas e ainda não enviadas, respeitando
 * o canal de e-mail por categoria e a preferência do membro. Marca `emailedAt`
 * para não reenviar. Protegido por CRON_SECRET (Authorization: Bearer).
 */
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Notificações não lidas e ainda não enviadas por e-mail.
  const pending = await db
    .select({ id: notifications.id, recipientId: notifications.recipientId, type: notifications.type, payload: notifications.payload, createdAt: notifications.createdAt })
    .from(notifications)
    .where(and(isNull(notifications.readAt), isNull(notifications.emailedAt)))
    .limit(2000);

  if (pending.length === 0) return NextResponse.json({ ok: true, sent: 0, recipients: 0 });

  // Agrupa por destinatário.
  const byUser = new Map<number, typeof pending>();
  for (const n of pending) {
    const arr = byUser.get(n.recipientId) ?? [];
    arr.push(n);
    byUser.set(n.recipientId, arr);
  }

  let sent = 0;
  let recipientsSent = 0;
  const markedIds: number[] = [];

  for (const [userId, items] of byUser) {
    // Filtra por permissão de e-mail (config + preferência do membro).
    const allowed: typeof items = [];
    for (const n of items) {
      if (await isEmailAllowed(userId, n.type)) allowed.push(n);
    }
    // Mesmo as não permitidas são marcadas para não reprocessar sempre.
    items.forEach((n) => markedIds.push(n.id));
    if (allowed.length === 0) continue;

    const [u] = await db.select({ email: users.email, name: users.displayName }).from(users).where(eq(users.id, userId)).limit(1);
    if (!u?.email) continue;

    const lines = allowed.map((n) => {
      const v = describeNotification(n.type, n.payload);
      const href = v.href ? `${env.APP_URL}${v.href}` : env.APP_URL;
      return `<li style="margin:6px 0"><a href="${href}">${escapeHtml(v.text)}</a></li>`;
    });
    const html = `<p>Olá, ${escapeHtml(u.name)}.</p><p>Você tem ${allowed.length} nova(s) notificação(ões) na RetroWiki:</p><ul>${lines.join("")}</ul><p><a href="${env.APP_URL}/conta?secao=notificacoes">Gerenciar notificações por e-mail</a></p>`;
    const text = `Olá, ${u.name}.\nVocê tem ${allowed.length} nova(s) notificação(ões):\n` + allowed.map((n) => "- " + describeNotification(n.type, n.payload).text).join("\n");

    await sendEmail({ to: u.email, subject: `RetroWiki: ${allowed.length} nova(s) notificação(ões)`, html, text });
    sent += allowed.length;
    recipientsSent += 1;
  }

  // Marca como enviadas (emailedAt) para não reprocessar.
  if (markedIds.length) {
    const now = new Date();
    for (let i = 0; i < markedIds.length; i += 500) {
      await db.update(notifications).set({ emailedAt: now }).where(inArray(notifications.id, markedIds.slice(i, i + 500)));
    }
  }

  return NextResponse.json({ ok: true, sent, recipients: recipientsSent });
}
