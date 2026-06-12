"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireRole, getCurrentUser, can } from "@/lib/auth-helpers";
import { logModAction } from "@/lib/panel";
import { addPhoto, deletePhoto, movePhoto, createAlbum, renameAlbum, deleteAlbum, setPhotoHidden, photoOwner } from "@/lib/gallery";
import { setSetting, sanitizeGallerySettings, sanitizeProfileCompletionSettings } from "@/lib/settings";

type Result = { ok: boolean; error?: string };

export async function addPhotoAction(url: string, caption: string, albumId?: number | null): Promise<Result> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }
  const res = await addPhoto(Number(user.id), String(url ?? ""), String(caption ?? ""), albumId ? Math.floor(Number(albumId)) : null);
  if (res.ok) { revalidatePath("/conta"); revalidatePath(`/u/${user.handle}`); }
  return res;
}

export async function movePhotoAction(id: number, albumId: number | null): Promise<Result> {
  let user;
  try { user = await requireUser(); } catch { return { ok: false, error: "Faça login." }; }
  if (!(await movePhoto(Math.floor(Number(id) || 0), Number(user.id), albumId ? Math.floor(Number(albumId)) : null))) return { ok: false, error: "Falha." };
  revalidatePath("/conta");
  revalidatePath(`/u/${user.handle}`);
  return { ok: true };
}

// ── Álbuns ──────────────────────────────────────────────────────────────────

export async function createAlbumAction(title: string): Promise<Result> {
  let user;
  try { user = await requireUser(); } catch { return { ok: false, error: "Faça login." }; }
  const res = await createAlbum(Number(user.id), String(title ?? ""));
  if (res.ok) revalidatePath("/conta");
  return res;
}

export async function renameAlbumAction(id: number, title: string): Promise<Result> {
  let user;
  try { user = await requireUser(); } catch { return { ok: false, error: "Faça login." }; }
  if (!(await renameAlbum(Math.floor(Number(id) || 0), Number(user.id), String(title ?? "")))) return { ok: false, error: "Falha." };
  revalidatePath("/conta");
  revalidatePath(`/u/${user.handle}`);
  return { ok: true };
}

export async function deleteAlbumAction(id: number): Promise<Result> {
  let user;
  try { user = await requireUser(); } catch { return { ok: false, error: "Faça login." }; }
  if (!(await deleteAlbum(Math.floor(Number(id) || 0), Number(user.id)))) return { ok: false, error: "Falha." };
  revalidatePath("/conta");
  revalidatePath(`/u/${user.handle}`);
  return { ok: true };
}

// ── Moderação: staff oculta/reexibe qualquer foto ───────────────────────────

export async function setPhotoHiddenAction(id: number, hidden: boolean): Promise<Result> {
  const user = await getCurrentUser();
  if (!can.moderate(user)) return { ok: false, error: "Acesso restrito." };
  const pid = Math.floor(Number(id) || 0);
  const owner = await photoOwner(pid);
  if (!(await setPhotoHidden(pid, Boolean(hidden)))) return { ok: false, error: "Falha." };
  await logModAction(Number(user!.id), hidden ? "photo_hidden" : "photo_unhidden", `photo:${pid}`);
  revalidatePath("/admin/denuncias");
  if (owner) {
    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const [u] = await db.select({ handle: users.handle }).from(users).where(eq(users.id, owner)).limit(1);
    if (u?.handle) revalidatePath(`/u/${u.handle}`);
  }
  return { ok: true };
}

export async function deletePhotoAction(id: number): Promise<Result> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }
  if (!(await deletePhoto(Math.floor(Number(id) || 0), Number(user.id)))) return { ok: false, error: "Falha." };
  revalidatePath("/conta");
  revalidatePath(`/u/${user.handle}`);
  return { ok: true };
}

// ── Admin: configurações de galeria e conclusão de perfil ──────────────────

async function asAdmin(): Promise<boolean> {
  try {
    await requireRole("admin");
    return true;
  } catch {
    return false;
  }
}

export async function saveGallerySettingsAction(body: string): Promise<Result> {
  if (!(await asAdmin())) return { ok: false, error: "Acesso restrito." };
  try {
    await setSetting("gallery", sanitizeGallerySettings(JSON.parse(body)));
    revalidatePath("/admin/perfis");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}

export async function saveProfileCompletionSettingsAction(body: string): Promise<Result> {
  if (!(await asAdmin())) return { ok: false, error: "Acesso restrito." };
  try {
    await setSetting("profile_completion", sanitizeProfileCompletionSettings(JSON.parse(body)));
    revalidatePath("/admin/perfis");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}
