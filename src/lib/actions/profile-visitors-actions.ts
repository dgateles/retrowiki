"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";

type Result = { ok: boolean; error?: string; data?: { show: boolean } };

/** Liga/desliga o bloco de "visitantes recentes" no próprio perfil. */
export async function toggleProfileVisitorsAction(): Promise<Result> {
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Faça login." };
  const userId = Number(user.id);
  const [u] = await db.select({ show: users.showVisitors, handle: users.handle }).from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return { ok: false, error: "Não foi possível concluir." };
  const next = !u.show;
  await db.update(users).set({ showVisitors: next }).where(eq(users.id, userId));
  revalidatePath(`/u/${u.handle}`);
  return { ok: true, data: { show: next } };
}
