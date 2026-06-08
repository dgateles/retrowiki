import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { verificationTokens } from "@/db/schema";

const HOUR = 60 * 60 * 1000;

export type TokenPurpose =
  | "email_verify"
  | "password_reset"
  | "email_change"
  | "magic_link";

const TTL: Record<TokenPurpose, number> = {
  email_verify: 24 * HOUR,
  password_reset: 1 * HOUR,
  email_change: 1 * HOUR,
  magic_link: 15 * 60 * 1000,
};

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Creates a token; returns the RAW value (goes in the e-mail link). Only the
 * hash is persisted. */
export async function createToken(
  purpose: TokenPurpose,
  email: string,
  userId?: number,
): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await db.insert(verificationTokens).values({
    userId: userId ?? null,
    email: email.toLowerCase(),
    purpose,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + TTL[purpose]),
  });
  return raw;
}

/** Validates and consumes a token (single-use). Returns the row or null. */
export async function consumeToken(raw: string, purpose: TokenPurpose) {
  const tokenHash = hashToken(raw);
  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.tokenHash, tokenHash),
        eq(verificationTokens.purpose, purpose),
        isNull(verificationTokens.consumedAt),
        gt(verificationTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row) return null;

  // mark consumed atomically (only succeeds if still unconsumed)
  const res = await db
    .update(verificationTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(verificationTokens.id, row.id),
        isNull(verificationTokens.consumedAt),
      ),
    );
  // mysql2 returns affectedRows; drizzle exposes it on [0].affectedRows
  const affected = (res as unknown as { affectedRows?: number }[])?.[0]?.affectedRows;
  if (affected === 0) return null;
  return row;
}
