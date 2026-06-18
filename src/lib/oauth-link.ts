import "server-only";
import { and, eq, lt } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/db";
import { oauthAccounts, oauthLinkStates } from "@/db/schema";
import { env } from "@/lib/env";

const PROVIDER = "google";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";
const STATE_TTL_MS = 10 * 60_000;

export const LINK_COOKIE = "rw_oauth_link";

/** redirect_uri SEMPRE no domínio canônico (APP_URL), nunca por header — evita
 * `0.0.0.0` e garante que casa com o URI cadastrado no Google. */
function redirectUri(): string {
  return `${env.APP_URL.replace(/\/$/, "")}/api/account/link/google/callback`;
}

const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Cria o state efêmero (uso único, PKCE) e devolve o id (vai no cookie e no
 * param `state`) + a URL de autorização do Google. */
export async function createLinkState(userId: number): Promise<{ id: string; url: string } | null> {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return null;
  const id = b64url(randomBytes(24));
  const codeVerifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(codeVerifier).digest());
  const expiresAt = new Date(Date.now() + STATE_TTL_MS);

  // Limpeza preguiçosa de states expirados.
  try { await db.delete(oauthLinkStates).where(lt(oauthLinkStates.expiresAt, new Date())); } catch { /* best-effort */ }
  await db.insert(oauthLinkStates).values({ id, userId, codeVerifier, expiresAt });

  const url = `${AUTH_ENDPOINT}?${new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: id,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  }).toString()}`;
  return { id, url };
}

/** Consome o state: confere que pertence ao usuário da sessão e não expirou,
 * APAGA (uso único) e devolve o code_verifier. */
export async function consumeLinkState(id: string, sessionUserId: number): Promise<string | null> {
  if (!id) return null;
  const [row] = await db.select().from(oauthLinkStates).where(eq(oauthLinkStates.id, id)).limit(1);
  // uso único: apaga sempre, mesmo se inválido.
  await db.delete(oauthLinkStates).where(eq(oauthLinkStates.id, id));
  if (!row) return null;
  if (row.userId !== sessionUserId) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) return null;
  return row.codeVerifier;
}

/** Troca o code por tokens e lê a identidade do userinfo autenticado. Valida
 * `email_verified` e os claims `aud`/`iss` do id_token. */
export async function fetchGoogleIdentity(code: string, codeVerifier: string): Promise<{ sub: string; email: string; emailVerified: boolean } | null> {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return null;
  try {
    const tokenRes = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri(),
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code_verifier: codeVerifier,
      }),
    });
    if (!tokenRes.ok) return null;
    const tokens = (await tokenRes.json()) as { access_token?: string; id_token?: string };
    if (!tokens.access_token) return null;

    // Validação de claims do id_token (defesa extra; o token veio do endpoint
    // TLS do Google em resposta à nossa troca autenticada).
    if (tokens.id_token) {
      const payload = decodeJwtPayload(tokens.id_token);
      const iss = String(payload?.iss ?? "");
      if (payload?.aud !== env.GOOGLE_CLIENT_ID) return null;
      if (iss !== "accounts.google.com" && iss !== "https://accounts.google.com") return null;
    }

    // Fonte da verdade: userinfo autenticado com o access_token.
    const infoRes = await fetch(USERINFO_ENDPOINT, { headers: { authorization: `Bearer ${tokens.access_token}` } });
    if (!infoRes.ok) return null;
    const info = (await infoRes.json()) as { sub?: string; email?: string; email_verified?: boolean };
    if (!info.sub || !info.email) return null;
    return { sub: info.sub, email: info.email.toLowerCase(), emailVerified: info.email_verified === true };
  } catch {
    return null;
  }
}

function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const part = jwt.split(".")[1];
    if (!part) return null;
    const json = Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export type LinkResult = "linked" | "already_self" | "conflict";

/** Vincula a identidade Google ao usuário. Conflito (sub de outra conta) é
 * rejeitado atomicamente pela constraint única. */
export async function linkGoogleToUser(userId: number, sub: string, email: string): Promise<LinkResult> {
  const [existing] = await db
    .select({ userId: oauthAccounts.userId })
    .from(oauthAccounts)
    .where(and(eq(oauthAccounts.provider, PROVIDER), eq(oauthAccounts.providerAccountId, sub)))
    .limit(1);
  if (existing) return existing.userId === userId ? "already_self" : "conflict";
  try {
    await db.insert(oauthAccounts).values({ userId, provider: PROVIDER, providerAccountId: sub, email: email || null });
    return "linked";
  } catch {
    // Corrida: alguém inseriu o mesmo sub entre o SELECT e o INSERT.
    const [now] = await db.select({ userId: oauthAccounts.userId }).from(oauthAccounts).where(and(eq(oauthAccounts.provider, PROVIDER), eq(oauthAccounts.providerAccountId, sub))).limit(1);
    return now?.userId === userId ? "already_self" : "conflict";
  }
}

/** Identidade Google vinculada (para o painel), ou null. */
export async function getLinkedGoogle(userId: number): Promise<{ email: string | null } | null> {
  const [row] = await db
    .select({ email: oauthAccounts.email })
    .from(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, PROVIDER)))
    .limit(1);
  return row ? { email: row.email } : null;
}

/** Conta de vínculos OAuth do usuário (para a regra de "não ficar sem login"). */
export async function countOAuthAccounts(userId: number): Promise<number> {
  const rows = await db.select({ id: oauthAccounts.id }).from(oauthAccounts).where(eq(oauthAccounts.userId, userId));
  return rows.length;
}

export async function unlinkGoogle(userId: number): Promise<void> {
  await db.delete(oauthAccounts).where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, PROVIDER)));
}
