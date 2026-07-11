import "server-only";
import { randomBytes, createHash } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, mfaRecoveryCodes } from "@/db/schema";
import { decryptSecret } from "@/lib/crypto-secret";
import { verifyTotp } from "@/lib/totp";

const RECOVERY_COUNT = 10;

function hashCode(code: string): string {
  return createHash("sha256").update(code.replace(/[\s-]/g, "").toUpperCase()).digest("hex");
}

/** Gera N códigos de recuperação legíveis (formato XXXX-XXXX). */
export function generateRecoveryCodes(count = RECOVERY_COUNT): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(8);
    let s = "";
    for (const b of bytes) s += alphabet[b % alphabet.length];
    codes.push(`${s.slice(0, 4)}-${s.slice(4, 8)}`);
  }
  return codes;
}

/** Substitui todos os códigos de recuperação do usuário pelos novos (guarda só hashes). */
export async function storeRecoveryCodes(userId: number, codes: string[]): Promise<void> {
  await db.delete(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.userId, userId));
  await db.insert(mfaRecoveryCodes).values(codes.map((c) => ({ userId, codeHash: hashCode(c) })));
}

/** Quantos códigos de recuperação ainda estão válidos. */
export async function countRemainingRecoveryCodes(userId: number): Promise<number> {
  const rows = await db
    .select({ id: mfaRecoveryCodes.id })
    .from(mfaRecoveryCodes)
    .where(and(eq(mfaRecoveryCodes.userId, userId), isNull(mfaRecoveryCodes.usedAt)));
  return rows.length;
}

/** Consome um código de recuperação válido (marca como usado). Retorna true se aceito. */
export async function consumeRecoveryCode(userId: number, input: string): Promise<boolean> {
  const hash = hashCode(input);
  const [row] = await db
    .select({ id: mfaRecoveryCodes.id })
    .from(mfaRecoveryCodes)
    .where(and(eq(mfaRecoveryCodes.userId, userId), eq(mfaRecoveryCodes.codeHash, hash), isNull(mfaRecoveryCodes.usedAt)))
    .limit(1);
  if (!row) return false;
  await db.update(mfaRecoveryCodes).set({ usedAt: new Date() }).where(eq(mfaRecoveryCodes.id, row.id));
  return true;
}

/**
 * Verifica o segundo fator de um usuário: aceita um código TOTP de 6 dígitos
 * OU um código de recuperação. Usado no login. Retorna true se válido.
 */
export async function verifySecondFactor(userId: number, encryptedSecret: string, input: string): Promise<boolean> {
  const code = input.trim();
  if (/^\d{6}$/.test(code)) {
    const secret = decryptSecret(encryptedSecret);
    if (secret && verifyTotp(secret, code)) return true;
  }
  // Fallback: código de recuperação (formato com letras/hífen).
  if (/^[A-Za-z0-9-]{8,9}$/.test(code)) {
    return consumeRecoveryCode(userId, code);
  }
  return false;
}

/** Lê o estado de 2FA de um usuário pelo id. */
export async function getMfaState(userId: number): Promise<{ enabled: boolean; hasSecret: boolean }> {
  const [row] = await db
    .select({ totpEnabled: users.totpEnabled, totpSecret: users.totpSecret })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return { enabled: !!row?.totpEnabled, hasSecret: !!row?.totpSecret };
}
