import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { stockReplies } from "@/db/schema";

export type StockReplyItem = { id: number; title: string; body: string };

/** Lista as respostas prontas (para o admin e para a equipe no editor). */
export async function listStockReplies(): Promise<StockReplyItem[]> {
  try {
    return await db
      .select({ id: stockReplies.id, title: stockReplies.title, body: stockReplies.body })
      .from(stockReplies)
      .orderBy(asc(stockReplies.sortOrder), asc(stockReplies.id));
  } catch {
    return [];
  }
}
