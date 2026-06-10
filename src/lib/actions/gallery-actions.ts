"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireRole } from "@/lib/auth-helpers";
import { addPhoto, deletePhoto } from "@/lib/gallery";
import { setSetting, sanitizeGallerySettings, sanitizeProfileCompletionSettings } from "@/lib/settings";

type Result = { ok: boolean; error?: string };

export async function addPhotoAction(url: string, caption: string): Promise<Result> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }
  const res = await addPhoto(Number(user.id), String(url ?? ""), String(caption ?? ""));
  if (res.ok) { revalidatePath("/conta"); revalidatePath(`/u/${user.handle}`); }
  return res;
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
