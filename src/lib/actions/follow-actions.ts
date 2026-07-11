"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { userFollows, users } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { createNotification } from "@/lib/notifications";

type Result = { ok: boolean; error?: string; data?: { following: boolean } };

/** Seguir ou deixar de seguir um usuário. Não vale para si mesmo. */
export async function toggleFollowUserAction(targetId: number): Promise<Result> {
  const me = await requireUser().catch(() => null);
  if (!me) return { ok: false, error: "Faça login." };
  const userId = Number(me.id);
  if (targetId === userId) return { ok: false, error: "Você não pode seguir a si mesmo." };

  const [target] = await db.select({ id: users.id, handle: users.handle }).from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) return { ok: false, error: "Usuário não encontrado." };

  const [existing] = await db.select({ id: userFollows.id }).from(userFollows)
    .where(and(eq(userFollows.followerId, userId), eq(userFollows.followedId, targetId))).limit(1);

  let following: boolean;
  if (existing) {
    await db.delete(userFollows).where(eq(userFollows.id, existing.id));
    following = false;
  } else {
    await db.insert(userFollows).values({ followerId: userId, followedId: targetId }).catch(() => {});
    following = true;
    // Notifica quem passou a ser seguido.
    const [me2] = await db.select({ handle: users.handle, displayName: users.displayName, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, userId)).limit(1);
    if (me2) {
      await createNotification(targetId, "user.followed", { actorName: me2.displayName, actorHandle: me2.handle, actorAvatar: me2.avatarUrl });
    }
  }
  revalidatePath(`/u/${target.handle}`);
  return { ok: true, data: { following } };
}
