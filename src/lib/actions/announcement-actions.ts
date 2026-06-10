"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { createAnnouncement, setAnnouncementActive, deleteAnnouncement, type Variant } from "@/lib/announcements";

type Result = { ok: boolean; error?: string };

const VARIANTS = ["info", "warning", "success"];

async function admin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

export async function createAnnouncementAction(body: string): Promise<Result> {
  const actor = await admin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const message = String(p.message ?? "").trim();
    if (message.length < 1) return { ok: false, error: "Informe a mensagem." };
    const variant = (VARIANTS.includes(String(p.variant)) ? String(p.variant) : "info") as Variant;
    const linkUrl = String(p.linkUrl ?? "").trim();
    // Só http(s) absoluto ou caminho raiz-relativo (evita javascript:/data: etc.).
    if (linkUrl && !/^(https?:\/\/|\/)[^\s]*$/i.test(linkUrl)) {
      return { ok: false, error: "O link deve ser uma URL http(s) ou um caminho começando com /." };
    }
    const id = await createAnnouncement({ message, variant, linkUrl, linkLabel: String(p.linkLabel ?? "").trim() }, Number(actor.id));
    if (!id) return { ok: false, error: "Falha ao criar." };
    revalidatePath("/admin/anuncios");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Dados inválidos." };
  }
}

export async function toggleAnnouncementAction(id: number, active: boolean): Promise<Result> {
  if (!(await admin())) return { ok: false, error: "Acesso restrito." };
  if (!(await setAnnouncementActive(id, active))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/anuncios");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteAnnouncementAction(id: number): Promise<Result> {
  if (!(await admin())) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteAnnouncement(id))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/anuncios");
  revalidatePath("/", "layout");
  return { ok: true };
}
