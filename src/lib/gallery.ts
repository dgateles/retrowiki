import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { memberPhotos, memberAlbums } from "@/db/schema";
import { getGallerySettings } from "@/lib/settings";

export type MemberPhoto = { id: number; url: string; caption: string; albumId: number | null; hidden: boolean };
export type MemberAlbum = { id: number; title: string };

const MAX_ALBUMS = 12;

/** Fotos visíveis no perfil público (oculta as moderadas). */
export async function listPhotos(userId: number): Promise<MemberPhoto[]> {
  try {
    return await db
      .select({ id: memberPhotos.id, url: memberPhotos.url, caption: memberPhotos.caption, albumId: memberPhotos.albumId, hidden: memberPhotos.hidden })
      .from(memberPhotos)
      .where(and(eq(memberPhotos.userId, userId), eq(memberPhotos.hidden, false)))
      .orderBy(asc(memberPhotos.sortOrder), asc(memberPhotos.id));
  } catch {
    return [];
  }
}

/** Fotos para gestão (dono/staff) — inclui as ocultas. */
export async function listPhotosManage(userId: number): Promise<MemberPhoto[]> {
  try {
    return await db
      .select({ id: memberPhotos.id, url: memberPhotos.url, caption: memberPhotos.caption, albumId: memberPhotos.albumId, hidden: memberPhotos.hidden })
      .from(memberPhotos)
      .where(eq(memberPhotos.userId, userId))
      .orderBy(asc(memberPhotos.sortOrder), asc(memberPhotos.id));
  } catch {
    return [];
  }
}

export async function listAlbums(userId: number): Promise<MemberAlbum[]> {
  try {
    return await db
      .select({ id: memberAlbums.id, title: memberAlbums.title })
      .from(memberAlbums)
      .where(eq(memberAlbums.userId, userId))
      .orderBy(asc(memberAlbums.sortOrder), asc(memberAlbums.id));
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

/** Dono de uma foto (para integração com o sistema de denúncias). */
export async function photoOwner(id: number): Promise<number | null> {
  try {
    const [p] = await db.select({ userId: memberPhotos.userId }).from(memberPhotos).where(eq(memberPhotos.id, id)).limit(1);
    return p?.userId ?? null;
  } catch {
    return null;
  }
}

export async function addPhoto(userId: number, url: string, caption: string, albumId?: number | null): Promise<{ ok: boolean; error?: string }> {
  try {
    const settings = await getGallerySettings();
    if (!settings.enabled) return { ok: false, error: "A galeria está desativada." };
    if (!/^https?:\/\//i.test(url)) return { ok: false, error: "URL inválida." };
    if ((await photoCount(userId)) >= settings.maxPhotos) return { ok: false, error: `Limite de ${settings.maxPhotos} fotos atingido.` };
    // Valida o álbum (precisa pertencer ao usuário).
    let album: number | null = null;
    if (albumId) {
      const [a] = await db.select({ id: memberAlbums.id }).from(memberAlbums).where(and(eq(memberAlbums.id, albumId), eq(memberAlbums.userId, userId))).limit(1);
      album = a ? a.id : null;
    }
    const all = await db.select({ s: memberPhotos.sortOrder }).from(memberPhotos).where(eq(memberPhotos.userId, userId));
    const sortOrder = Math.max(0, ...all.map((r) => r.s)) + 1;
    await db.insert(memberPhotos).values({ userId, albumId: album, url: url.slice(0, 500), caption: caption.slice(0, 200), sortOrder });
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

/** Move uma foto para um álbum (ou para fora, com null). */
export async function movePhoto(id: number, userId: number, albumId: number | null): Promise<boolean> {
  try {
    let album: number | null = null;
    if (albumId) {
      const [a] = await db.select({ id: memberAlbums.id }).from(memberAlbums).where(and(eq(memberAlbums.id, albumId), eq(memberAlbums.userId, userId))).limit(1);
      if (!a) return false;
      album = a.id;
    }
    await db.update(memberPhotos).set({ albumId: album }).where(and(eq(memberPhotos.id, id), eq(memberPhotos.userId, userId)));
    return true;
  } catch {
    return false;
  }
}

// ── Álbuns ──────────────────────────────────────────────────────────────────

export async function createAlbum(userId: number, title: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const t = title.trim().slice(0, 120);
    if (t.length < 1) return { ok: false, error: "Dê um nome ao álbum." };
    const [c] = await db.select({ n: sql<number>`COUNT(*)` }).from(memberAlbums).where(eq(memberAlbums.userId, userId));
    if (Number(c?.n ?? 0) >= MAX_ALBUMS) return { ok: false, error: `Limite de ${MAX_ALBUMS} álbuns.` };
    const all = await db.select({ s: memberAlbums.sortOrder }).from(memberAlbums).where(eq(memberAlbums.userId, userId));
    const sortOrder = Math.max(0, ...all.map((r) => r.s)) + 1;
    await db.insert(memberAlbums).values({ userId, title: t, sortOrder });
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao criar álbum." };
  }
}

export async function renameAlbum(id: number, userId: number, title: string): Promise<boolean> {
  try {
    const t = title.trim().slice(0, 120);
    if (!t) return false;
    await db.update(memberAlbums).set({ title: t }).where(and(eq(memberAlbums.id, id), eq(memberAlbums.userId, userId)));
    return true;
  } catch {
    return false;
  }
}

/** Exclui um álbum; as fotos voltam para "Geral" (albumId = null). */
export async function deleteAlbum(id: number, userId: number): Promise<boolean> {
  try {
    await db.update(memberPhotos).set({ albumId: null }).where(and(eq(memberPhotos.albumId, id), eq(memberPhotos.userId, userId)));
    await db.delete(memberAlbums).where(and(eq(memberAlbums.id, id), eq(memberAlbums.userId, userId)));
    return true;
  } catch {
    return false;
  }
}

// ── Moderação (staff) ─────────────────────────────────────────────────────────

export async function setPhotoHidden(id: number, hidden: boolean): Promise<boolean> {
  try {
    await db.update(memberPhotos).set({ hidden }).where(eq(memberPhotos.id, id));
    return true;
  } catch {
    return false;
  }
}
