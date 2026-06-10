"use server";

import { nanoid } from "nanoid";
import { requireUser, requireRole } from "@/lib/auth-helpers";
import { isBunnyConfigured, uploadToBunny, sniffImage } from "@/lib/bunny";

type Result = { ok: boolean; error?: string; url?: string };

// Pastas permitidas e quem pode enviar para cada uma.
const FOLDERS: Record<string, "admin" | "user"> = {
  badges: "admin",
  ranks: "admin",
  quests: "admin",
  pages: "admin",
  avatars: "user",
  covers: "user",
  gallery: "user",
};

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadImageAction(formData: FormData): Promise<Result> {
  const folder = String(formData.get("folder") ?? "");
  const scope = FOLDERS[folder];
  if (!scope) return { ok: false, error: "Destino inválido." };

  // Autorização conforme o destino.
  try {
    if (scope === "admin") await requireRole("admin");
    else await requireUser();
  } catch {
    return { ok: false, error: "Acesso restrito." };
  }

  if (!isBunnyConfigured()) return { ok: false, error: "Armazenamento de imagens não configurado." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Selecione uma imagem." };
  if (file.size > MAX_BYTES) return { ok: false, error: "Imagem muito grande (máx. 5 MB)." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return { ok: false, error: "Formato inválido. Use PNG, JPG, WEBP ou GIF." };

  try {
    const path = `${folder}/${nanoid()}.${kind.ext}`;
    const url = await uploadToBunny(path, bytes, kind.contentType);
    return { ok: true, url };
  } catch {
    return { ok: false, error: "Falha ao enviar a imagem." };
  }
}
