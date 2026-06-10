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
import { verifyEmail, resetPassword as resetTpl, passwordChanged, emailChange as emailChangeTpl } from "@/lib/email/templates";
import { requireUser } from "@/lib/auth-helpers";
import { slugify } from "@/lib/utils";
import { validateRegistrationValues, saveRegistrationValues } from "@/lib/profile-fields";
import { isBanned } from "@/lib/admin/ban-filters";
import { hasQuestions, checkAnswer, geoActionForCountry } from "@/lib/spam";
import { countryCodeForIp } from "@/lib/geo";
import { recordReferral } from "@/lib/referrals";

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
  input: { email: string; handle: string; password: string; profileFields?: Record<string, string>; qaQuestionId?: number; qaAnswer?: string; ref?: string },
  captcha: Solution | undefined,
): Promise<ActionResult> {
  const clientIp = await ip();
  const rl = await checkRateLimit(`register:${clientIp}`, 5, 10 * 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas tentativas. Tente mais tarde." };

  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  // captcha proprietário (RetroGuard)
  if (!(await verifyCaptcha(captcha, { action: "register" }))) {
    return { ok: false, error: "Falha na verificação anti-bot. Recarregue e tente de novo." };
  }

  // Desafio Pergunta & Resposta (anti-bot), se houver perguntas cadastradas.
  if (await hasQuestions()) {
    const qid = Math.floor(Number(input.qaQuestionId) || 0);
    if (qid <= 0 || !(await checkAnswer(qid, String(input.qaAnswer ?? "")))) {
      return { ok: false, error: "Resposta do desafio incorreta." };
    }
  }

  // Campos de perfil exibidos no cadastro: valida antes de criar a conta.
  const profileFields = input.profileFields ?? {};
  const fieldsCheck = await validateRegistrationValues(profileFields);
  if (!fieldsCheck.ok) return { ok: false, error: fieldsCheck.error };

  const email = parsed.data.email.toLowerCase();
  const handle = parsed.data.handle.toLowerCase();

  // Filtros de banimento (e-mail, IP, nome). Bloqueio genérico.
  if (await isBanned({ email, ip: clientIp, name: parsed.data.handle })) {
    return { ok: false, error: "Cadastro não permitido." };
  }

  // Geolocalização: bloquear ou sinalizar (criar suspenso) por país.
  const geoAction = await geoActionForCountry(await countryCodeForIp(clientIp));
  if (geoAction === "block") {
    return { ok: false, error: "Cadastro não permitido." };
  }
  const flagged = geoAction === "flag";

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
      isSuspended: flagged,
    });
    const userId = (res as unknown as { insertId: number }).insertId;
    await saveRegistrationValues(userId, profileFields);
    if (input.ref) await recordReferral(input.ref, userId);
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

/** Reenvia o e-mail de confirmação para o usuário logado (se ainda não verificado). */
export async function resendVerificationAction(): Promise<ActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }
  const rl = await checkRateLimit(`resendverify:${user.id}`, 3, 10 * 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas tentativas. Tente mais tarde." };

  const [u] = await db.select({ email: users.email, handle: users.handle, verified: users.emailVerifiedAt }).from(users).where(eq(users.id, Number(user.id))).limit(1);
  if (!u) return { ok: false, error: "Usuário não encontrado." };
  if (u.verified) return { ok: true, message: "Seu e-mail já está confirmado." };

  const raw = await createToken("email_verify", u.email, Number(user.id));
  try {
    await sendEmail({ to: u.email, ...verifyEmail(u.handle, raw) });
  } catch {
    /* silencioso */
  }
  return { ok: true, message: "Enviamos um novo e-mail de confirmação." };
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  const row = await consumeToken(token, "email_verify");
  if (!row) return { ok: false, error: "Link inválido ou expirado." };
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.email, row.email));
  return { ok: true, message: "E-mail confirmado! Você já pode entrar." };
}

const EmailSchema = z.object({ email: z.email() });

/** Solicita troca de e-mail: envia confirmação para o NOVO endereço. */
export async function requestEmailChangeAction(input: { email: string }): Promise<ActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }
  const rl = await checkRateLimit(`emailchange:${user.id}`, 5, 10 * 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas tentativas. Tente mais tarde." };

  const parsed = EmailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "E-mail inválido." };
  const newEmail = parsed.data.email.toLowerCase();

  const [me] = await db.select({ email: users.email }).from(users).where(eq(users.id, Number(user.id))).limit(1);
  if (me?.email === newEmail) return { ok: false, error: "Esse já é o seu e-mail atual." };

  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, newEmail)).limit(1);
  if (taken) return { ok: false, error: "Esse e-mail já está em uso." };

  const raw = await createToken("email_change", newEmail, Number(user.id));
  try {
    await sendEmail({ to: newEmail, ...emailChangeTpl(raw) });
  } catch {
    /* silencioso */
  }
  return { ok: true, message: "Enviamos um link de confirmação para o novo e-mail." };
}

/** Confirma a troca de e-mail a partir do token enviado ao novo endereço. */
export async function confirmEmailChangeAction(token: string): Promise<ActionResult> {
  const row = await consumeToken(token, "email_change");
  if (!row || !row.userId) return { ok: false, error: "Link inválido ou expirado." };
  // o novo e-mail pode ter sido tomado nesse meio-tempo
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, row.email)).limit(1);
  if (taken && taken.id !== row.userId) return { ok: false, error: "Esse e-mail já está em uso." };
  await db.update(users).set({ email: row.email, emailVerifiedAt: new Date() }).where(eq(users.id, row.userId));
  return { ok: true, message: "E-mail atualizado com sucesso." };
}

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
