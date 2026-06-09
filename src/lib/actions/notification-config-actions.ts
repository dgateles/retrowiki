"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { requireRole, requireUser } from "@/lib/auth-helpers";
import { saveNotificationsConfig, resetAllMemberPrefs, saveMemberPrefs } from "@/lib/notifications-prefs";

type Result = { ok: boolean; error?: string };

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

export async function saveNotificationsConfigAction(body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    await saveNotificationsConfig(JSON.parse(body));
    revalidatePath("/admin/notificacoes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}

export async function resetAllMemberPrefsAction(): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    await resetAllMemberPrefs();
    await db.insert(auditLog).values({ actorId: Number(actor.id), action: "notif_prefs_reset", target: "all" });
    revalidatePath("/admin/notificacoes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao redefinir." };
  }
}

export async function saveMyNotificationPrefsAction(body: string): Promise<Result> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }
  try {
    const input = JSON.parse(body) as Record<string, { inApp: boolean; email: boolean }>;
    await saveMemberPrefs(Number(user.id), input);
    revalidatePath("/conta");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}
