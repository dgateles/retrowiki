"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireRole } from "@/lib/auth-helpers";
import { exportUserData, createDeletionRequest, resolveDeletionRequest } from "@/lib/privacy";
import { logModAction } from "@/lib/panel";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

/** Membro baixa uma cópia dos próprios dados (LGPD: direito de acesso). */
export async function exportMyDataAction(): Promise<Result<{ json: string }>> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }
  const data = await exportUserData(Number(user.id));
  if (!data) return { ok: false, error: "Falha ao exportar." };
  return { ok: true, data: { json: JSON.stringify(data, null, 2) } };
}

/** Membro solicita exclusão da conta (revisada por um admin). */
export async function requestDeletionAction(reason: string): Promise<Result> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }
  const res = await createDeletionRequest(Number(user.id), String(reason ?? ""));
  if (res.ok) revalidatePath("/conta");
  return res;
}

/** Admin resolve um pedido de exclusão (completa = anonimiza). */
export async function resolveDeletionRequestAction(id: number, decision: "completed" | "rejected"): Promise<Result> {
  let actor;
  try {
    actor = await requireRole("admin");
  } catch {
    return { ok: false, error: "Acesso restrito." };
  }
  if (decision !== "completed" && decision !== "rejected") return { ok: false, error: "Decisão inválida." };
  const res = await resolveDeletionRequest(id, decision, Number(actor.id));
  if (res.ok) {
    await logModAction(Number(actor.id), `deletion_${decision}`, `request:${id}`);
    revalidatePath("/admin/privacidade");
  }
  return res;
}
