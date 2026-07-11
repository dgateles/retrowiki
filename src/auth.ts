import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { recordMemberIp, getClientIp } from "@/lib/ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { isBanned } from "@/lib/admin/ban-filters";
import { resolveOAuthUser } from "@/lib/oauth";
import { verifySecondFactor } from "@/lib/mfa";
import { env } from "@/lib/env";
import type { UserRole } from "@/db/schema";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  code: z.string().optional(), // segundo fator (TOTP ou código de recuperação)
});

const providers: NextAuthConfig["providers"] = [];

// Google (opcional): só ativo quando as credenciais estão no ambiente.
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // O vínculo é feito em resolveOAuthUser (exige email_verified do Google e
      // aplica "verificado vence"). Não usar allowDangerousEmailAccountLinking.
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  trustHost: true,
  pages: { signIn: "/auth/entrar" },
  providers: [
    ...providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password, code } = parsed.data;
        const lowerEmail = email.toLowerCase();
        const ip = await getClientIp();

        // Anti brute force / credential stuffing: limita tentativas por IP e por
        // e-mail. Retorna null (igual a credenciais inválidas) quando excede.
        const [rlIp, rlEmail] = await Promise.all([
          checkRateLimit(`login:ip:${ip}`, 15, 10 * 60_000),
          checkRateLimit(`login:email:${lowerEmail}`, 8, 10 * 60_000),
        ]);
        if (!rlIp.ok || !rlEmail.ok) return null;

        // Filtros de banimento (e-mail / IP) bloqueiam o login.
        if (await isBanned({ email: lowerEmail, ip })) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, lowerEmail))
          .limit(1);

        if (!user || user.isSuspended) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        // Segundo fator: se o usuário tem 2FA ativo, exige código válido.
        if (user.totpEnabled && user.totpSecret) {
          if (!code || !(await verifySecondFactor(user.id, user.totpSecret, code))) return null;
        }

        await recordMemberIp(user.id);

        return {
          id: String(user.id),
          name: user.displayName,
          email: user.email,
          role: user.role,
          handle: user.handle,
          sv: user.sessionVersion,
          emailVerified: user.emailVerifiedAt,
        };
      },
    }),
  ],
  callbacks: {
    // Login social: resolve/cria/vincula a conta UMA vez aqui (onde o `account`
    // com o `sub` existe), bloqueia banidos/suspensos contra a conta RESOLVIDA,
    // e grava nossos campos no `user` para o `jwt` apenas copiar (sem 2ª query).
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const sub = account.providerAccountId;
        const email = (user.email ?? (profile?.email as string | undefined) ?? "").toLowerCase();
        const emailVerified = profile?.email_verified === true;
        const u = await resolveOAuthUser({ sub, email, emailVerified, name: user.name, image: user.image });
        if (!u || u.isSuspended) return false;
        // Ban/suspensão contra o e-mail da CONTA resolvida (não o do Google, que
        // pode diferir num vínculo de e-mail diferente).
        if (await isBanned({ email: u.email, ip: await getClientIp() })) return false;
        await recordMemberIp(u.id);
        // Plumbing para o jwt: substitui o id do provedor (sub) pelos nossos campos.
        user.id = String(u.id);
        (user as { role?: UserRole }).role = u.role as UserRole;
        (user as { handle?: string }).handle = u.handle;
        (user as { sv?: number }).sv = u.sessionVersion;
      }
      return true;
    },
    async jwt({ token, user }) {
      // Credentials e OAuth chegam aqui com os mesmos campos (OAuth preenchidos
      // no signIn). Cópia pura, sem escrita no banco.
      if (user && (user as { role?: UserRole }).role) {
        token.uid = user.id;
        token.role = (user as { role: UserRole }).role;
        token.handle = (user as { handle: string }).handle;
        token.sv = (user as { sv?: number }).sv ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as UserRole;
        session.user.handle = token.handle as string;
        session.user.sv = (token.sv as number | undefined) ?? 0;
      }
      return session;
    },
  },
});
