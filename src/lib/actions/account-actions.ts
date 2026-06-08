"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { hashPassword, verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/mailer";
import { passwordChanged } from "@/lib/email/templates";

type Result = { ok: boolean; error?: string; message?: string };

const Schema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual."),
  newPassword: z.string().min(8, "A nova senha precisa de ao menos 8 caracteres.").max(200),
});

export async function changePasswordAction(input: unknown): Promise<Result> {
  let session;
  try {
    session = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }
  const rl = await checkRateLimit(`pwd:${session.id}`, 5, 10 * 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas tentativas. Aguarde." };

  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const [user] = await db.select().from(users).where(eq(users.id, Number(session.id))).limit(1);
  if (!user) return { ok: false, error: "Conta não encontrada." };

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { ok: false, error: "Senha atual incorreta." };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  try {
    await sendEmail({ to: user.email, ...passwordChanged() });
  } catch {
    /* best-effort */
  }
  return { ok: true, message: "Senha alterada com sucesso." };
}
