"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { db } from "@/db";
import { users, mfaRecoveryCodes } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/ip";
import { isBanned } from "@/lib/admin/ban-filters";
import { encryptSecret, decryptSecret } from "@/lib/crypto-secret";
import { generateTotpSecret, totpUri, verifyTotp } from "@/lib/totp";
import {
  generateRecoveryCodes,
  storeRecoveryCodes,
  countRemainingRecoveryCodes,
} from "@/lib/mfa";

type Result<T = undefined> = { ok: boolean; error?: string; data?: T };

async function loadMe() {
  const me = await requireUser().catch(() => null);
  if (!me) return null;
  const [row] = await db
    .select({ id: users.id, email: users.email, displayName: users.displayName, passwordHash: users.passwordHash, totpSecret: users.totpSecret, totpEnabled: users.totpEnabled })
    .from(users)
    .where(eq(users.id, Number(me.id)))
    .limit(1);
  return row ?? null;
}

/**
 * Passo 1 do setup: gera um segredo novo, guarda cifrado (ainda não ativa) e
 * devolve o QR + segredo em texto para o app autenticador.
 */
export async function beginMfaSetupAction(): Promise<Result<{ secret: string; qrDataUri: string }>> {
  const me = await loadMe();
  if (!me) return { ok: false, error: "Faça login." };
  if (me.totpEnabled) return { ok: false, error: "A verificação em duas etapas já está ativa." };

  const secret = generateTotpSecret();
  await db.update(users).set({ totpSecret: encryptSecret(secret), totpEnabled: false }).where(eq(users.id, me.id));

  const uri = totpUri(secret, me.email);
  const qrDataUri = await QRCode.toDataURL(uri, { margin: 1, width: 220 });
  return { ok: true, data: { secret, qrDataUri } };
}

/**
 * Passo 2 do setup: confirma com um código do app. Se válido, ativa o 2FA e
 * gera os códigos de recuperação (mostrados uma única vez).
 */
export async function confirmMfaSetupAction(code: string): Promise<Result<{ recoveryCodes: string[] }>> {
  const me = await loadMe();
  if (!me) return { ok: false, error: "Faça login." };
  if (me.totpEnabled) return { ok: false, error: "A verificação em duas etapas já está ativa." };
  if (!me.totpSecret) return { ok: false, error: "Inicie a configuração antes de confirmar." };

  const secret = decryptSecret(me.totpSecret);
  if (!secret || !verifyTotp(secret, code)) return { ok: false, error: "Código inválido. Verifique o app e tente de novo." };

  const recoveryCodes = generateRecoveryCodes();
  await db.update(users).set({ totpEnabled: true }).where(eq(users.id, me.id));
  await storeRecoveryCodes(me.id, recoveryCodes);
  revalidatePath("/conta");
  return { ok: true, data: { recoveryCodes } };
}

/** Desativa o 2FA. Exige a senha atual para confirmar identidade. */
export async function disableMfaAction(password: string): Promise<Result> {
  const me = await loadMe();
  if (!me) return { ok: false, error: "Faça login." };
  if (!me.totpEnabled) return { ok: false, error: "A verificação em duas etapas não está ativa." };
  if (!(await verifyPassword(password, me.passwordHash))) return { ok: false, error: "Senha incorreta." };

  await db.update(users).set({ totpEnabled: false, totpSecret: null }).where(eq(users.id, me.id));
  await db.delete(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.userId, me.id));
  revalidatePath("/conta");
  return { ok: true };
}

/** Gera novos códigos de recuperação (invalida os antigos). Exige a senha atual. */
export async function regenerateRecoveryCodesAction(password: string): Promise<Result<{ recoveryCodes: string[] }>> {
  const me = await loadMe();
  if (!me) return { ok: false, error: "Faça login." };
  if (!me.totpEnabled) return { ok: false, error: "Ative a verificação em duas etapas primeiro." };
  if (!(await verifyPassword(password, me.passwordHash))) return { ok: false, error: "Senha incorreta." };

  const recoveryCodes = generateRecoveryCodes();
  await storeRecoveryCodes(me.id, recoveryCodes);
  revalidatePath("/conta");
  return { ok: true, data: { recoveryCodes } };
}

/**
 * Precheck do login: revela se a conta exige código 2FA, sem completar o login.
 * Rate-limited igual ao login, para não virar oráculo de senhas.
 */
export async function checkLoginMfaAction(email: string, password: string): Promise<Result<{ needCode: boolean }>> {
  const lowerEmail = (email || "").trim().toLowerCase();
  if (!lowerEmail || !password) return { ok: false, error: "Informe e-mail e senha." };

  const ip = await getClientIp();
  const [rlIp, rlEmail] = await Promise.all([
    checkRateLimit(`login:ip:${ip}`, 15, 10 * 60_000),
    checkRateLimit(`login:email:${lowerEmail}`, 8, 10 * 60_000),
  ]);
  if (!rlIp.ok || !rlEmail.ok) return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos." };
  if (await isBanned({ email: lowerEmail, ip })) return { ok: true, data: { needCode: false } };

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash, isSuspended: users.isSuspended, totpEnabled: users.totpEnabled })
    .from(users)
    .where(eq(users.email, lowerEmail))
    .limit(1);

  // Resposta neutra para credenciais inválidas: não revela existência da conta.
  if (!user || user.isSuspended) return { ok: true, data: { needCode: false } };
  if (!(await verifyPassword(password, user.passwordHash))) return { ok: true, data: { needCode: false } };

  return { ok: true, data: { needCode: !!user.totpEnabled } };
}

/** Estado atual do 2FA para a tela de segurança. */
export async function getMfaStatusAction(): Promise<Result<{ enabled: boolean; remainingCodes: number }>> {
  const me = await loadMe();
  if (!me) return { ok: false, error: "Faça login." };
  const remainingCodes = me.totpEnabled ? await countRemainingRecoveryCodes(me.id) : 0;
  return { ok: true, data: { enabled: !!me.totpEnabled, remainingCodes } };
}
