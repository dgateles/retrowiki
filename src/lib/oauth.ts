import "server-only";
import { and, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { users, oauthAccounts } from "@/db/schema";
import { slugify } from "@/lib/utils";
import { sendEmail } from "@/lib/email/mailer";
import { passwordChanged } from "@/lib/email/templates";

export type OAuthUser = { id: number; email: string; role: string; handle: string; isSuspended: boolean; sessionVersion: number };

const PROVIDER = "google";

/** Vincula (ou no-op) a identidade Google ao usuário — idempotente pela
 * constraint única (provider, sub). Re-login/re-vínculo viram um update do
 * e-mail guardado, sem lançar erro. */
async function linkAccount(userId: number, sub: string, email: string): Promise<void> {
  await db
    .insert(oauthAccounts)
    .values({ userId, provider: PROVIDER, providerAccountId: sub, email: email || null })
    .onDuplicateKeyUpdate({ set: { email: email || null } });
}

/** Resolve (ou cria) o usuário RetroWiki a partir de um login Google.
 *
 * Ordem: (1) por `sub` na oauth_accounts → conta vinculada (inclusive e-mail
 * diferente); (2) por e-mail — exige `email_verified` do Google; aplica
 * "verificado vence" quando a conta tem senha e e-mail não verificado;
 * (3) cria conta nova. Sempre grava o `sub`. Roda UMA vez, no `signIn`. */
export async function resolveOAuthUser(params: {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string | null;
  image?: string | null;
}): Promise<OAuthUser | null> {
  const sub = String(params.sub ?? "").trim();
  const lower = (params.email ?? "").trim().toLowerCase();
  if (!sub) return null;

  try {
    // 1) Por `sub`: identidade já vinculada.
    const [linked] = await db
      .select({ userId: oauthAccounts.userId, storedEmail: oauthAccounts.email })
      .from(oauthAccounts)
      .where(and(eq(oauthAccounts.provider, PROVIDER), eq(oauthAccounts.providerAccountId, sub)))
      .limit(1);
    if (linked) {
      const [u] = await db
        .select({ id: users.id, email: users.email, role: users.role, handle: users.handle, isSuspended: users.isSuspended, sessionVersion: users.sessionVersion })
        .from(users).where(eq(users.id, linked.userId)).limit(1);
      if (!u) return null;
      if (lower && lower !== (linked.storedEmail ?? "")) {
        await db.update(oauthAccounts).set({ email: lower }).where(and(eq(oauthAccounts.provider, PROVIDER), eq(oauthAccounts.providerAccountId, sub)));
      }
      return { id: u.id, email: u.email, role: u.role, handle: u.handle, isSuspended: u.isSuspended, sessionVersion: u.sessionVersion };
    }

    // Daqui pra frente dependemos do e-mail — exige verificação do Google.
    // (Workspace de domínio não verificado retorna email_verified=false.)
    if (!lower || !/@/.test(lower) || !params.emailVerified) return null;

    // 2) Por e-mail.
    const [existing] = await db
      .select({ id: users.id, role: users.role, handle: users.handle, isSuspended: users.isSuspended, sessionVersion: users.sessionVersion, avatarUrl: users.avatarUrl, emailVerifiedAt: users.emailVerifiedAt, passwordHash: users.passwordHash })
      .from(users).where(eq(users.email, lower)).limit(1);
    if (existing) {
      const hasPassword = existing.passwordHash !== "";
      if (hasPassword && !existing.emailVerifiedAt) {
        // "Verificado vence": o Google provou a posse. Marca verificado, ANULA a
        // senha (possível senha de atacante) e bumpa session_version. Retorna o
        // sv PÓS-bump para o token recém-emitido não se auto-deslogar.
        const newSv = existing.sessionVersion + 1;
        await db.update(users).set({
          emailVerifiedAt: new Date(),
          passwordHash: "",
          sessionVersion: newSv,
          ...(!existing.avatarUrl && params.image ? { avatarUrl: params.image.slice(0, 500) } : {}),
        }).where(eq(users.id, existing.id));
        await linkAccount(existing.id, sub, lower);
        try { await sendEmail({ to: lower, ...passwordChanged() }); } catch { /* best-effort */ }
        return { id: existing.id, email: lower, role: existing.role, handle: existing.handle, isSuspended: existing.isSuspended, sessionVersion: newSv };
      }
      // Conta verificada ou sem senha → vincula com segurança.
      const patch: { emailVerifiedAt?: Date; avatarUrl?: string } = {};
      if (!existing.emailVerifiedAt) patch.emailVerifiedAt = new Date();
      if (!existing.avatarUrl && params.image) patch.avatarUrl = params.image.slice(0, 500);
      if (Object.keys(patch).length) await db.update(users).set(patch).where(eq(users.id, existing.id));
      await linkAccount(existing.id, sub, lower);
      return { id: existing.id, email: lower, role: existing.role, handle: existing.handle, isSuspended: existing.isSuspended, sessionVersion: existing.sessionVersion };
    }

    // 3) Cria conta nova. Handle único (fallback à prova de colisão).
    const base = (slugify(params.name ?? "") || slugify(lower.split("@")[0]) || "membro").slice(0, 24);
    let handle = base;
    for (let i = 0; i < 5; i++) {
      const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.handle, handle)).limit(1);
      if (!taken) break;
      handle = `${base}-${randomBytes(4).toString("hex")}`;
    }
    let id: number;
    try {
      const [res] = await db.insert(users).values({
        email: lower, handle,
        displayName: (params.name ?? lower.split("@")[0]).slice(0, 80),
        passwordHash: "", emailVerifiedAt: new Date(),
        avatarUrl: params.image ? params.image.slice(0, 500) : null,
      });
      id = (res as unknown as { insertId: number }).insertId;
    } catch {
      // Corrida: outro login criou a mesma conta — reresolve por e-mail.
      const [again] = await db.select({ id: users.id, role: users.role, handle: users.handle, isSuspended: users.isSuspended, sessionVersion: users.sessionVersion }).from(users).where(eq(users.email, lower)).limit(1);
      if (!again) return null;
      await linkAccount(again.id, sub, lower);
      return { id: again.id, email: lower, role: again.role, handle: again.handle, isSuspended: again.isSuspended, sessionVersion: again.sessionVersion };
    }
    await linkAccount(id, sub, lower);
    return { id, email: lower, role: "member", handle, isSuspended: false, sessionVersion: 0 };
  } catch {
    return null;
  }
}
