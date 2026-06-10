import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { memberPhotos } from "@/db/schema";
import { getGallerySettings } from "@/lib/settings";

export type MemberPhoto = { id: number; url: string; caption: string };

export async function listPhotos(userId: number): Promise<MemberPhoto[]> {
  try {
    const rows = await db.select({ id: memberPhotos.id, url: memberPhotos.url, caption: memberPhotos.caption }).from(memberPhotos).where(eq(memberPhotos.userId, userId)).orderBy(asc(memberPhotos.sortOrder), asc(memberPhotos.id));
    return rows;
  } catch {
    return [];
  }
}

export async function photoCount(userId: number): Promise<number> {
  try {
    const [c] = await db.select({ n: sql<number>`COUNT(*)` }).from(memberPhotos).where(eq(memberPhotos.userId, userId));
    return Number(c?.n ?? 0);
  } catch {
    return 0;
  }
}

export async function addPhoto(userId: number, url: string, caption: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const settings = await getGallerySettings();
    if (!settings.enabled) return { ok: false, error: "A galeria está desativada." };
    if (!/^https?:\/\//i.test(url)) return { ok: false, error: "URL inválida." };
    if ((await photoCount(userId)) >= settings.maxPhotos) return { ok: false, error: `Limite de ${settings.maxPhotos} fotos atingido.` };
    const all = await db.select({ s: memberPhotos.sortOrder }).from(memberPhotos).where(eq(memberPhotos.userId, userId));
    const sortOrder = Math.max(0, ...all.map((r) => r.s)) + 1;
    await db.insert(memberPhotos).values({ userId, url: url.slice(0, 500), caption: caption.slice(0, 200), sortOrder });
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao adicionar." };
  }
}

export async function deletePhoto(id: number, userId: number): Promise<boolean> {
  try {
    await db.delete(memberPhotos).where(and(eq(memberPhotos.id, id), eq(memberPhotos.userId, userId)));
    return true;
  } catch {
    return false;
  }
}
