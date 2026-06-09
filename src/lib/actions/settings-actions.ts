"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { setSetting, sanitizeAchievementSettings } from "@/lib/settings";

type Result = { ok: boolean; error?: string };

export async function saveAchievementSettingsAction(body: string): Promise<Result> {
  let actor;
  try {
    actor = await requireRole("admin");
  } catch {
    return { ok: false, error: "Acesso restrito." };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return { ok: false, error: "Dados inválidos." };
  }
  try {
    await setSetting("achievements", sanitizeAchievementSettings(parsed));
    await db.insert(auditLog).values({ actorId: Number(actor.id), action: "achievement_settings_update", target: "settings:achievements" });
    revalidatePath("/admin/gamificacao/configuracoes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}
