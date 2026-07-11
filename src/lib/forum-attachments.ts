import "server-only";
import { inArray, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { forumAttachments } from "@/db/schema";
import { isBunnyUrl } from "@/lib/bunny";

export type Attachment = { url: string; filename: string; contentType: string };
export type PostAttachment = Attachment & { id: number };

const MAX_PER_POST = 8;
const ALLOWED_CT = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/** Sanitiza a lista vinda do cliente: só URLs do Bunny, tipos de imagem, limite. */
export function sanitizeAttachments(raw: unknown): Attachment[] {
  if (!Array.isArray(raw)) return [];
  const out: Attachment[] = [];
  for (const item of raw) {
    if (out.length >= MAX_PER_POST) break;
    if (!item || typeof item !== "object") continue;
    const { url, filename, contentType } = item as Record<string, unknown>;
    if (typeof url !== "string" || !isBunnyUrl(url)) continue;
    if (typeof contentType !== "string" || !ALLOWED_CT.has(contentType)) continue;
    const name = typeof filename === "string" && filename.trim() ? filename.trim().slice(0, 200) : "anexo";
    out.push({ url, filename: name, contentType });
  }
  return out;
}

/** Grava os anexos de um post recém-criado. */
export async function insertAttachments(postId: number, atts: Attachment[]): Promise<void> {
  if (!atts.length) return;
  await db.insert(forumAttachments).values(atts.map((a, i) => ({ postId, url: a.url, filename: a.filename, contentType: a.contentType, sortOrder: i })));
}

/** Anexos de vários posts, em lote (para a listagem do tópico). */
export async function getAttachmentsFor(postIds: number[]): Promise<Map<number, PostAttachment[]>> {
  const ids = [...new Set(postIds)].filter(Boolean);
  const map = new Map<number, PostAttachment[]>();
  if (!ids.length) return map;
  const rows = await db
    .select({ id: forumAttachments.id, postId: forumAttachments.postId, url: forumAttachments.url, filename: forumAttachments.filename, contentType: forumAttachments.contentType })
    .from(forumAttachments)
    .where(inArray(forumAttachments.postId, ids))
    .orderBy(asc(forumAttachments.sortOrder), asc(forumAttachments.id));
  for (const r of rows) {
    const arr = map.get(r.postId) ?? [];
    arr.push({ id: r.id, url: r.url, filename: r.filename, contentType: r.contentType });
    map.set(r.postId, arr);
  }
  return map;
}

/** Remove os anexos de um post (usado ao excluir post). */
export async function deleteAttachmentsForPost(postId: number): Promise<void> {
  await db.delete(forumAttachments).where(eq(forumAttachments.postId, postId));
}
