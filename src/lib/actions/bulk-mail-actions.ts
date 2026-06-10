"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth-helpers";
import { sendBulkMail, setBulkMailOptOut, type Audience } from "@/lib/bulk-mail";
import { logModAction } from "@/lib/panel";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

const AUDIENCES = ["all", "member", "contributor", "moderator", "admin"];

export async function sendBulkMailAction(subject: string, body: string, audience: string): Promise<Result<{ sent: number }>> {
  let actor;
  try {
    actor = await requireRole("admin");
  } catch {
    return { ok: false, error: "Acesso restrito." };
  }
  if (!AUDIENCES.includes(audience)) return { ok: false, error: "Audiência inválida." };
  const res = await sendBulkMail(String(subject ?? ""), String(body ?? ""), audience as Audience, Number(actor.id));
  if (!res.ok) return { ok: false, error: res.error };
  await logModAction(Number(actor.id), "bulk_mail_sent", `audience:${audience}`, { sent: res.sent });
  revalidatePath("/admin/bulk-mail");
  return { ok: true, data: { sent: res.sent } };
}

export async function setBulkMailOptOutAction(optOut: boolean): Promise<Result> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }
  await setBulkMailOptOut(Number(user.id), Boolean(optOut));
  revalidatePath("/conta");
  return { ok: true };
}
