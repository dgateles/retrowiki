"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { userIgnores, users } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";

type Result = { ok: boolean; error?: string; data?: { ignoring: boolean } };

/** Ignora ou deixa de ignorar um usuário. Não vale para si mesmo nem para staff. */
export async function toggleIgnoreUserAction(targetId: number): Promise<Result> {
  const me = await requireUser().catch(() => null);
  if (!me) return { ok: false, error: "Faça login." };
  const userId = Number(me.id);
  if (targetId === userId) return { ok: false, error: "Você não pode ignorar a si mesmo." };

  const [target] = await db.select({ id: users.id, role: users.role, handle: users.handle }).from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) return { ok: false, error: "Usuário não encontrado." };
  if (target.role === "moderator" || target.role === "admin") return { ok: false, error: "Não é possível ignorar a equipe." };

  const [existing] = await db.select({ id: userIgnores.id }).from(userIgnores)
    .where(and(eq(userIgnores.userId, userId), eq(userIgnores.ignoredId, targetId))).limit(1);

  let ignoring: boolean;
  if (existing) {
    await db.delete(userIgnores).where(eq(userIgnores.id, existing.id));
    ignoring = false;
  } else {
    await db.insert(userIgnores).values({ userId, ignoredId: targetId }).catch(() => {});
    ignoring = true;
  }
  revalidatePath(`/u/${target.handle}`);
  revalidatePath("/conta");
  return { ok: true, data: { ignoring } };
}
