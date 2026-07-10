import "server-only";
import { and, asc, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { conversations, conversationParticipants, conversationMessages, users } from "@/db/schema";
import { forumDocFromBody } from "@/lib/forum";
import { richDocToText, type RichDoc } from "@/lib/blocks/rich-schema";

export type ConvPerson = { id: number; handle: string; name: string; avatar: string | null };
export type ConversationListItem = {
  id: number; subject: string; lastMessageAt: Date | null; unread: boolean;
  others: ConvPerson[]; preview: string;
};

/** É participante ativo desta conversa? */
export async function isParticipant(convId: number, userId: number): Promise<boolean> {
  try {
    const [p] = await db.select({ id: conversationParticipants.id }).from(conversationParticipants)
      .where(and(eq(conversationParticipants.conversationId, convId), eq(conversationParticipants.userId, userId), isNull(conversationParticipants.leftAt))).limit(1);
    return !!p;
  } catch { return false; }
}

/** Conversas do usuário, mais recentes primeiro, com o(s) outro(s) participante(s),
 * prévia da última mensagem e flag de não lida. */
export async function listConversations(userId: number): Promise<ConversationListItem[]> {
  try {
    const parts = await db.select({ convId: conversationParticipants.conversationId, lastReadAt: conversationParticipants.lastReadAt })
      .from(conversationParticipants)
      .where(and(eq(conversationParticipants.userId, userId), isNull(conversationParticipants.leftAt)));
    if (!parts.length) return [];
    const convIds = parts.map((p) => p.convId);
    const lastReadByConv = new Map(parts.map((p) => [p.convId, p.lastReadAt]));

    const convs = await db.select().from(conversations).where(inArray(conversations.id, convIds)).orderBy(desc(conversations.lastMessageAt));
    const otherParts = await db.select({ convId: conversationParticipants.conversationId, id: users.id, handle: users.handle, name: users.displayName, avatar: users.avatarUrl })
      .from(conversationParticipants).innerJoin(users, eq(users.id, conversationParticipants.userId))
      .where(and(inArray(conversationParticipants.conversationId, convIds), ne(conversationParticipants.userId, userId)));
    const othersByConv = new Map<number, ConvPerson[]>();
    for (const p of otherParts) {
      const arr = othersByConv.get(p.convId) ?? [];
      arr.push({ id: p.id, handle: p.handle, name: p.name, avatar: p.avatar });
      othersByConv.set(p.convId, arr);
    }

    const items: ConversationListItem[] = [];
    for (const c of convs) {
      const [last] = await db.select({ body: conversationMessages.body }).from(conversationMessages)
        .where(eq(conversationMessages.conversationId, c.id)).orderBy(desc(conversationMessages.createdAt)).limit(1);
      const preview = last ? richDocToText(forumDocFromBody(last.body) as RichDoc).slice(0, 140) : "";
      const lastRead = lastReadByConv.get(c.id) ?? null;
      const unread = !!c.lastMessageAt && (!lastRead || c.lastMessageAt.getTime() > lastRead.getTime());
      items.push({ id: c.id, subject: c.subject, lastMessageAt: c.lastMessageAt, unread, others: othersByConv.get(c.id) ?? [], preview });
    }
    return items;
  } catch {
    return [];
  }
}

export type ConversationMessageView = { id: number; body: string; createdAt: Date; senderId: number; senderHandle: string; senderName: string; senderAvatar: string | null };
export type ConversationView = { id: number; subject: string; others: ConvPerson[]; messages: ConversationMessageView[] };

/** Carrega uma conversa (se o usuário participa) com mensagens e participantes. */
export async function getConversation(convId: number, userId: number): Promise<ConversationView | null> {
  try {
    if (!(await isParticipant(convId, userId))) return null;
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1);
    if (!conv) return null;
    const others = await db.select({ id: users.id, handle: users.handle, name: users.displayName, avatar: users.avatarUrl })
      .from(conversationParticipants).innerJoin(users, eq(users.id, conversationParticipants.userId))
      .where(and(eq(conversationParticipants.conversationId, convId), ne(conversationParticipants.userId, userId)));
    const messages = await db.select({
      id: conversationMessages.id, body: conversationMessages.body, createdAt: conversationMessages.createdAt,
      senderId: users.id, senderHandle: users.handle, senderName: users.displayName, senderAvatar: users.avatarUrl,
    }).from(conversationMessages).innerJoin(users, eq(users.id, conversationMessages.senderId))
      .where(eq(conversationMessages.conversationId, convId)).orderBy(asc(conversationMessages.createdAt)).limit(500);
    return { id: conv.id, subject: conv.subject, others, messages };
  } catch {
    return null;
  }
}

/** Quantas conversas têm mensagens novas (para o selo no header). */
export async function getUnreadConversationCount(userId: number | null): Promise<number> {
  if (!userId) return 0;
  try {
    const parts = await db.select({ convId: conversationParticipants.conversationId, lastReadAt: conversationParticipants.lastReadAt })
      .from(conversationParticipants).where(and(eq(conversationParticipants.userId, userId), isNull(conversationParticipants.leftAt)));
    if (!parts.length) return 0;
    const convIds = parts.map((p) => p.convId);
    const convs = await db.select({ id: conversations.id, lastMessageAt: conversations.lastMessageAt }).from(conversations).where(inArray(conversations.id, convIds));
    const lastReadByConv = new Map(parts.map((p) => [p.convId, p.lastReadAt]));
    let n = 0;
    for (const c of convs) {
      const lr = lastReadByConv.get(c.id) ?? null;
      if (c.lastMessageAt && (!lr || c.lastMessageAt.getTime() > lr.getTime())) n++;
    }
    return n;
  } catch {
    return 0;
  }
}

/** Marca a conversa como lida agora. */
export async function markConversationRead(convId: number, userId: number): Promise<void> {
  try {
    await db.update(conversationParticipants).set({ lastReadAt: new Date() })
      .where(and(eq(conversationParticipants.conversationId, convId), eq(conversationParticipants.userId, userId)));
  } catch { /* ignora */ }
}
