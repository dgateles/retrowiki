import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { recordMemberIp, getClientIp } from "@/lib/ip";
import { isBanned } from "@/lib/admin/ban-filters";
import type { UserRole } from "@/db/schema";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  trustHost: true,
  pages: { signIn: "/auth/entrar" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Filtros de banimento (e-mail / IP) bloqueiam o login.
        if (await isBanned({ email: email.toLowerCase(), ip: await getClientIp() })) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
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
          emailVerified: user.emailVerifiedAt,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as { role: UserRole }).role;
        token.handle = (user as { handle: string }).handle;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as UserRole;
        session.user.handle = token.handle as string;
      }
      return session;
    },
  },
});
