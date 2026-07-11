import "server-only";
import { asc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { forumPrefixes } from "@/db/schema";
import type { ForumPrefixColor } from "@/lib/forum-prefix-style";

export { PREFIX_CHIP_CLASS } from "@/lib/forum-prefix-style";
export type Prefix = { id: number; label: string; slug: string; color: ForumPrefixColor; sortOrder: number };

/** Todos os prefixos, na ordem de exibição. */
export async function listPrefixes(): Promise<Prefix[]> {
  return db
    .select({ id: forumPrefixes.id, label: forumPrefixes.label, slug: forumPrefixes.slug, color: forumPrefixes.color, sortOrder: forumPrefixes.sortOrder })
    .from(forumPrefixes)
    .orderBy(asc(forumPrefixes.sortOrder), asc(forumPrefixes.label));
}

/** Mapa id → prefixo, para hidratar listagens de tópicos em lote. */
export async function getPrefixMap(ids: number[]): Promise<Map<number, Prefix>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows = await db
    .select({ id: forumPrefixes.id, label: forumPrefixes.label, slug: forumPrefixes.slug, color: forumPrefixes.color, sortOrder: forumPrefixes.sortOrder })
    .from(forumPrefixes)
    .where(inArray(forumPrefixes.id, unique));
  return new Map(rows.map((r) => [r.id, r]));
}
