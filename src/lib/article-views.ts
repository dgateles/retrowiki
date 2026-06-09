import "server-only";
import { createHash } from "crypto";
import { headers } from "next/headers";
import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { articleViews, articles } from "@/db/schema";

// Chave de visitante: usuário logado, ou hash do IP para anônimos (privacidade).
async function viewerKey(userId: number | null): Promise<string> {
  if (userId) return `u${userId}`;
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "0").trim();
  return `ip${createHash("sha256").update(ip).digest("hex").slice(0, 40)}`;
}

// Conta uma visualização única por (artigo, visitante). A constraint única faz a
// deduplicação: a primeira visita insere e incrementa; as seguintes falham e são
// ignoradas.
export async function recordView(articleId: number, userId: number | null): Promise<void> {
  try {
    const key = await viewerKey(userId);
    await db.insert(articleViews).values({ articleId, viewerKey: key });
    await db
      .update(articles)
      .set({ viewsCount: sql`${articles.viewsCount} + 1` })
      .where(eq(articles.id, articleId));
  } catch {
    // visitante já contabilizado, ou indisponível
  }
}
