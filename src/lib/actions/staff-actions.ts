"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { setSetting, sanitizeStaffSettings } from "@/lib/settings";

type Result = { ok: boolean; error?: string };

export async function saveStaffSettingsAction(body: string): Promise<Result> {
  try {
    await requireRole("admin");
  } catch {
    return { ok: false, error: "Acesso restrito." };
  }
  try {
    await setSetting("staff", sanitizeStaffSettings(JSON.parse(body)));
    revalidatePath("/admin/moderadores");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}
