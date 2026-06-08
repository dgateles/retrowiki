"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { createToken, consumeToken } from "@/lib/tokens";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyCaptcha, type Solution } from "@/lib/captcha";
import { sendEmail } from "@/lib/email/mailer";
import { verifyEmail, resetPassword as resetTpl, passwordChanged } from "@/lib/email/templates";
import { slugify } from "@/lib/utils";

type ActionResult = { ok: boolean; message?: string; error?: string };

async function ip(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const RegisterSchema = z.object({
  email: z.email(),
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/i, "Use letras, números ou _"),
  password: z.string().min(8, "Mínimo de 8 caracteres").max(200),
});

export async function registerAction(
  input: { email: string; handle: string; password: string },
  captcha: Solution | undefined,
): Promise<ActionResult> {
  const rl = await checkRateLimit(`register:${await ip()}`, 5, 10 * 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas tentativas. Tente mais tarde." };

  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  // captcha proprietário (RetroGuard)
  if (!(await verifyCaptcha(captcha, { action: "register" }))) {
    return { ok: false, error: "Falha na verificação anti-bot. Recarregue e tente de novo." };
  }

  const email = parsed.data.email.toLowerCase();
  const handle = parsed.data.handle.toLowerCase();

  // anti-enumeração: resposta genérica mesmo se já existir
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!existing) {
    const [handleTaken] = await db.select({ id: users.id }).from(users).where(eq(users.handle, handle)).limit(1);
    const finalHandle = handleTaken ? `${handle}_${Date.now().toString(36).slice(-4)}` : handle;
    const passwordHash = await hashPassword(parsed.data.password);
    const [res] = await db.insert(users).values({
      email,
      handle: finalHandle,
      displayName: parsed.data.handle,
      passwordHash,
    });
    const userId = (res as unknown as { insertId: number }).insertId;
    const raw = await createToken("email_verify", email, userId);
    const tpl = verifyEmail(finalHandle, raw);
    try {
      await sendEmail({ to: email, ...tpl });
    } catch {
      /* falha de e-mail não trava o cadastro */
    }
  }

  return { ok: true, message: "Enviamos um e-mail de confirmação. Verifique sua caixa de entrada." };
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  const row = await consumeToken(token, "email_verify");
  if (!row) return { ok: false, error: "Link inválido ou expirado." };
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.email, row.email));
  return { ok: true, message: "E-mail confirmado! Você já pode entrar." };
}

const EmailSchema = z.object({ email: z.email() });

export async function requestPasswordResetAction(input: { email: string }): Promise<ActionResult> {
  const rl = await checkRateLimit(`reset:${await ip()}`, 5, 10 * 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas tentativas. Tente mais tarde." };

  const parsed = EmailSchema.safeParse(input);
  // resposta sempre genérica (anti-enumeração)
  const generic: ActionResult = {
    ok: true,
    message: "Se houver uma conta com esse e-mail, enviamos as instruções.",
  };
  if (!parsed.success) return generic;

  const email = parsed.data.email.toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user) {
    const raw = await createToken("password_reset", email, user.id);
    try {
      await sendEmail({ to: email, ...resetTpl(raw) });
    } catch {
      /* silencioso */
    }
  }
  return generic;
}

const ResetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Mínimo de 8 caracteres").max(200),
});

export async function resetPasswordAction(input: { token: string; password: string }): Promise<ActionResult> {
  const parsed = ResetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const row = await consumeToken(parsed.data.token, "password_reset");
  if (!row) return { ok: false, error: "Link inválido ou expirado." };

  const passwordHash = await hashPassword(parsed.data.password);
  await db.update(users).set({ passwordHash }).where(eq(users.email, row.email));
  try {
    await sendEmail({ to: row.email, ...passwordChanged() });
  } catch {
    /* silencioso */
  }
  return { ok: true, message: "Senha redefinida! Você já pode entrar." };
}
