import "server-only";
import { randomBytes, createHmac, createHash, timingSafeEqual } from "node:crypto";
import { lt } from "drizzle-orm";
import { db } from "@/db";
import { captchaNonces } from "@/db/schema";
import { env } from "@/lib/env";

/**
 * RetroGuard — captcha proprietário (ver docs-plataforma/14).
 * Camadas: Proof-of-Work invisível + nonce assinado single-use + sinais
 * comportamentais. Sem terceiros, acessível (PoW roda em Web Worker).
 */

const TTL_MS = 2 * 60_000; // 2 min

export type Challenge = {
  nonce: string;
  difficulty: number;
  action: string;
  exp: number;
  sig: string;
};

export type Signals = {
  honeypot?: string;
  elapsedMs?: number;
  interacted?: boolean;
};

export type Solution = Challenge & { counter: number; signals?: Signals };

function sign(c: Omit<Challenge, "sig">): string {
  const data = `${c.nonce}.${c.difficulty}.${c.action}.${c.exp}`;
  return createHmac("sha256", env.CAPTCHA_SECRET).update(data).digest("base64url");
}

/** Difficulty (PoW leading-zero bits) by risk. 16 ≈ imperceptível. */
export function issueChallenge(action: string, difficulty = 16): Challenge {
  const base = {
    nonce: randomBytes(16).toString("hex"),
    difficulty,
    action,
    exp: Date.now() + TTL_MS,
  };
  return { ...base, sig: sign(base) };
}

function verifySig(c: Challenge): boolean {
  const expected = Buffer.from(
    sign({ nonce: c.nonce, difficulty: c.difficulty, action: c.action, exp: c.exp }),
  );
  const got = Buffer.from(c.sig ?? "");
  return (
    expected.length === got.length &&
    timingSafeEqual(expected, got) &&
    c.exp > Date.now()
  );
}

function leadingZeroBits(bytes: Buffer): number {
  let bits = 0;
  for (const byte of bytes) {
    if (byte === 0) {
      bits += 8;
      continue;
    }
    bits += Math.clz32(byte) - 24;
    break;
  }
  return bits;
}

function riskFromSignals(s?: Signals): "OK" | "BLOCK" {
  if (!s) return "OK";
  if (s.honeypot) return "BLOCK"; // honeypot preenchido = bot
  return "OK";
}

/** Records a nonce once; returns false if it was already used (replay). */
async function consumeNonce(nonce: string, exp: number): Promise<boolean> {
  try {
    await db.insert(captchaNonces).values({
      nonce,
      expiresAt: new Date(exp),
    });
    return true;
  } catch {
    return false; // duplicate primary key = replay
  }
}

/** Best-effort cleanup of expired nonces. */
export async function cleanupNonces() {
  await db.delete(captchaNonces).where(lt(captchaNonces.expiresAt, new Date()));
}

export async function verifyCaptcha(
  solution: Solution | undefined,
  ctx: { action: string },
): Promise<boolean> {
  if (!solution) return false;

  // 1) assinatura válida, fresca, e ação correta (anti-precomputação)
  if (!verifySig(solution) || solution.action !== ctx.action) return false;

  // 2) sinais comportamentais
  if (riskFromSignals(solution.signals) === "BLOCK") return false;

  // 3) anti-replay (nonce single-use)
  if (!(await consumeNonce(solution.nonce, solution.exp))) return false;

  // 4) Proof-of-Work realmente resolvido
  const hash = createHash("sha256")
    .update(solution.nonce + solution.counter)
    .digest();
  if (leadingZeroBits(hash) < solution.difficulty) return false;

  return true;
}
