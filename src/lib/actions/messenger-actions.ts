"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { conversations, conversationParticipants, conversationMessages, users } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { isIgnoring } from "@/lib/ignore";
import { isParticipant } from "@/lib/messenger";
import { isRichDoc, RichDocSchema, richDocToText } from "@/lib/blocks/rich-schema";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };
const insertId = (r: unknown) => (r as unknown as [{ insertId: number }])[0].insertId;

/** Valida e serializa o corpo rico da mensagem (mesma allowlist do fórum). */
function validateBody(raw: unknown): { ok: true; json: string; text: string } | { ok: false; error: string } {
  if (typeof raw !== "string" || raw.length > 100_000) return { ok: false, error: "Mensagem inválida." };
  let doc: unknown;
  try { doc = JSON.parse(raw); } catch { return { ok: false, error: "Mensagem inválida." }; }
  if (!isRichDoc(doc)) return { ok: false, error: "Mensagem inválida." };
  const parsed = RichDocSchema.safeParse(doc);
  if (!parsed.success) return { ok: false, error: "Mensagem inválida." };
  const text = richDocToText(parsed.data);
  if (text.trim().length < 1) return { ok: false, error: "Escreva uma mensagem." };
  if (text.length > 10000) return { ok: false, error: "Mensagem muito longa." };
  return { ok: true, json: JSON.stringify(parsed.data), text };
}

const StartSchema = z.object({
  recipient: z.string().trim().min(1).max(60),
  subject: z.string().trim().min(2, "Assunto muito curto.").max(200),
  body: z.string(),
});
export async function startConversationAction(input: unknown): Promise<Result<{ conversationId: number }>> {
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Faça login." };
  const parsed = StartSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const valid = validateBody(parsed.data.body);
  if (!valid.ok) return { ok: false, error: valid.error };
  const userId = Number(user.id);

  const rl = await checkRateLimit(`pm:start:${userId}`, 10, 10 * 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas conversas iniciadas. Aguarde." };

  const handle = parsed.data.recipient.replace(/^@/, "").toLowerCase();
  const [recipient] = await db.select({ id: users.id, handle: users.handle, name: users.displayName }).from(users).where(eq(users.handle, handle)).limit(1);
  if (!recipient) return { ok: false, error: "Usuário não encontrado." };
  if (recipient.id === userId) return { ok: false, error: "Você não pode enviar mensagem para si mesmo." };
  if (await isIgnoring(userId, recipient.id)) return { ok: false, error: "Mensagem não enviada: você está ignorando este usuário. Deixe de ignorá-lo para conversar." };
  if (await isIgnoring(recipient.id, userId)) return { ok: false, error: "Mensagem não enviada: este usuário não está aceitando suas mensagens." };

  const now = new Date();
  const conversationId = await db.transaction(async (tx) => {
    const cIns = await tx.insert(conversations).values({ subject: parsed.data.subject, starterId: userId, lastMessageAt: now });
    const cId = insertId(cIns);
    await tx.insert(conversationParticipants).values([
      { conversationId: cId, userId, lastReadAt: now },
      { conversationId: cId, userId: recipient.id, lastReadAt: null },
    ]);
    await tx.insert(conversationMessages).values({ conversationId: cId, senderId: userId, body: valid.json });
    return cId;
  });

  const [meStart] = await db.select({ name: users.displayName }).from(users).where(eq(users.id, userId)).limit(1);
  await createNotification(recipient.id, "pm.received", { conversationId, subject: parsed.data.subject, actorName: meStart?.name ?? "Alguém" });
  revalidatePath("/mensagens");
  return { ok: true, data: { conversationId } };
}

const ReplySchema = z.object({ conversationId: z.number().int().positive(), body: z.string() });
export async function sendMessageAction(input: unknown): Promise<Result> {
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Faça login." };
  const parsed = ReplySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };
  const valid = validateBody(parsed.data.body);
  if (!valid.ok) return { ok: false, error: valid.error };
  const userId = Number(user.id);

  if (!(await isParticipant(parsed.data.conversationId, userId))) return { ok: false, error: "Conversa indisponível." };
  const rl = await checkRateLimit(`pm:msg:${userId}`, 30, 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas mensagens. Aguarde." };

  const now = new Date();
  await db.insert(conversationMessages).values({ conversationId: parsed.data.conversationId, senderId: userId, body: valid.json });
  await db.update(conversations).set({ lastMessageAt: now }).where(eq(conversations.id, parsed.data.conversationId));
  await db.update(conversationParticipants).set({ lastReadAt: now }).where(and(eq(conversationParticipants.conversationId, parsed.data.conversationId), eq(conversationParticipants.userId, userId)));

  const [conv] = await db.select({ subject: conversations.subject }).from(conversations).where(eq(conversations.id, parsed.data.conversationId)).limit(1);
  const [meReply] = await db.select({ name: users.displayName }).from(users).where(eq(users.id, userId)).limit(1);
  const recipients = await db.select({ userId: conversationParticipants.userId }).from(conversationParticipants)
    .where(and(eq(conversationParticipants.conversationId, parsed.data.conversationId), ne(conversationParticipants.userId, userId), isNull(conversationParticipants.leftAt)));
  for (const r of recipients) {
    await createNotification(r.userId, "pm.reply", { conversationId: parsed.data.conversationId, subject: conv?.subject ?? "", actorName: meReply?.name ?? "Alguém" });
  }

  revalidatePath(`/mensagens/${parsed.data.conversationId}`);
  revalidatePath("/mensagens");
  return { ok: true };
}
