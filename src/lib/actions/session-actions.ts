"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";

type Result = { ok: boolean; error?: string };

/**
 * Encerra todas as sessões do usuário em qualquer aparelho, incrementando o
 * sessionVersion (invalida todos os JWT antigos — inclusive o atual, que
 * exigirá novo login). Fecha o ciclo do 2FA em caso de suspeita.
 */
export async function signOutEverywhereAction(): Promise<Result> {
  const me = await requireUser().catch(() => null);
  if (!me) return { ok: false, error: "Faça login." };
  await db.update(users).set({ sessionVersion: sql`${users.sessionVersion} + 1` }).where(eq(users.id, Number(me.id)));
  return { ok: true };
}
