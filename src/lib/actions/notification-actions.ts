"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { markAllRead, markOneRead, deleteOne } from "@/lib/notifications";

export async function markNotificationsReadAction(): Promise<void> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return;
  }
  await markAllRead(Number(user.id));
  revalidatePath("/notificacoes");
}

export async function markNotificationReadAction(id: number): Promise<void> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return;
  }
  await markOneRead(Number(user.id), id);
}

export async function deleteNotificationAction(id: number): Promise<{ ok: boolean }> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false };
  }
  await deleteOne(Number(user.id), id);
  revalidatePath("/notificacoes");
  return { ok: true };
}
