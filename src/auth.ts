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
import { getOrCreateOAuthUser } from "@/lib/oauth";
import { env } from "@/lib/env";
import type { UserRole } from "@/db/schema";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const providers: NextAuthConfig["providers"] = [];

// Google (opcional): só ativo quando as credenciais estão no ambiente.
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // O vínculo é feito manualmente em getOrCreateOAuthUser, que recusa contas
      // com senha + e-mail não verificado (anti-account-takeover). Não usar
      // allowDangerousEmailAccountLinking.
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

        const { email, password } = parsed.data;
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
    // Login social: cria/vincula o usuário e bloqueia banidos/suspensos.
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase();
        if (!email) return false;
        if (await isBanned({ email, ip: await getClientIp() })) return false;
        const u = await getOrCreateOAuthUser(email, user.name, user.image);
        if (!u || u.isSuspended) return false;
        await recordMemberIp(u.id);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        if ((user as { role?: UserRole }).role) {
          // Credentials: o usuário já traz os nossos campos.
          token.uid = user.id;
          token.role = (user as { role: UserRole }).role;
          token.handle = (user as { handle: string }).handle;
          token.sv = (user as { sv?: number }).sv ?? 0;
        } else if (user.email) {
          // OAuth: resolve o nosso usuário pelo e-mail.
          const u = await getOrCreateOAuthUser(user.email, user.name, user.image);
          if (u) {
            token.uid = String(u.id);
            token.role = u.role as UserRole;
            token.handle = u.handle;
            token.sv = u.sessionVersion;
          }
        }
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
