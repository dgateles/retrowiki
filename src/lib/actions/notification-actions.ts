"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { markAllRead } from "@/lib/notifications";

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
