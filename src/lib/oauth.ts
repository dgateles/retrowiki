import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { slugify } from "@/lib/utils";

export type OAuthUser = { id: number; role: string; handle: string; isSuspended: boolean; sessionVersion: number };

/** Encontra (ou cria) um usuário a partir de um login social. O e-mail do Google
 * já é verificado, então a conta entra com `emailVerifiedAt`. Sem senha. */
export async function getOrCreateOAuthUser(email: string, name?: string | null, image?: string | null): Promise<OAuthUser | null> {
  const lower = email.trim().toLowerCase();
  if (!lower || !/@/.test(lower)) return null;

  try {
    const [existing] = await db.select({ id: users.id, role: users.role, handle: users.handle, isSuspended: users.isSuspended, sessionVersion: users.sessionVersion, avatarUrl: users.avatarUrl, emailVerifiedAt: users.emailVerifiedAt, passwordHash: users.passwordHash }).from(users).where(eq(users.email, lower)).limit(1);
    if (existing) {
      // Segurança (anti-account-takeover): NÃO vincular automaticamente a uma
      // conta com senha que nunca confirmou o e-mail — ela pode ter sido
      // pré-criada por um atacante com o e-mail da vítima e senha conhecida.
      // O dono real do e-mail (provado pelo Google) deve confirmar o e-mail no
      // fluxo de senha antes de poder usar o Google. Contas sem senha (só OAuth)
      // ou já verificadas são seguras de vincular.
      if (existing.passwordHash && !existing.emailVerifiedAt) {
        return null;
      }
      // Marca como verificado e adota o avatar do Google se ainda não houver.
      const patch: { emailVerifiedAt?: Date; avatarUrl?: string } = {};
      if (!existing.emailVerifiedAt) patch.emailVerifiedAt = new Date();
      if (!existing.avatarUrl && image) patch.avatarUrl = image.slice(0, 500);
      if (Object.keys(patch).length) await db.update(users).set(patch).where(eq(users.id, existing.id));
      return { id: existing.id, role: existing.role, handle: existing.handle, isSuspended: existing.isSuspended, sessionVersion: existing.sessionVersion };
    }

    // Cria um handle único a partir do nome ou do local-part do e-mail.
    const base = (slugify(name ?? "") || slugify(lower.split("@")[0]) || "membro").slice(0, 24);
    let handle = base;
    for (let i = 0; i < 5; i++) {
      const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.handle, handle)).limit(1);
      if (!taken) break;
      handle = `${base}-${Math.floor(Math.random() * 9000 + 1000)}`;
    }

    const [res] = await db.insert(users).values({
      email: lower,
      handle,
      displayName: (name ?? lower.split("@")[0]).slice(0, 80),
      passwordHash: "",
      emailVerifiedAt: new Date(),
      avatarUrl: image ? image.slice(0, 500) : null,
    });
    const id = (res as unknown as { insertId: number }).insertId;
    return { id, role: "member", handle, isSuspended: false, sessionVersion: 0 };
  } catch {
    return null;
  }
}
