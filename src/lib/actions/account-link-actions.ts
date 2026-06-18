"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { requireUser, getCurrentUser } from "@/lib/auth-helpers";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { createLinkState, unlinkGoogle, countOAuthAccounts, getLinkedGoogle, LINK_COOKIE } from "@/lib/oauth-link";

type Result = { ok: boolean; error?: string; url?: string };

const PwdSchema = z.object({ password: z.string().max(200) });

/** Inicia o vínculo do Google: reautentica (senha, exceto conta só-Google) e
 * devolve a URL de autorização do Google, gravando o state no cookie. */
export async function startGoogleLinkAction(input: unknown): Promise<Result> {
  let session;
  try { session = await requireUser(); } catch { return { ok: false, error: "Faça login." }; }
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return { ok: false, error: "Login com Google indisponível." };

  const rl = await checkRateLimit(`oauthlink:${session.id}`, 8, 10 * 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas tentativas. Aguarde." };

  const parsed = PwdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Conta não encontrada." };

  // Já vinculado? evita reabrir o fluxo à toa.
  if (await getLinkedGoogle(user.id)) return { ok: false, error: "Sua conta já tem um Google vinculado." };

  // Reautenticação por senha — contas só-Google (sem senha) ficam isentas.
  const hasPassword = user.passwordHash !== "";
  if (hasPassword) {
    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) return { ok: false, error: "Senha incorreta." };
  }

  const state = await createLinkState(user.id);
  if (!state) return { ok: false, error: "Não foi possível iniciar." };

  (await cookies()).set(LINK_COOKIE, state.id, {
    httpOnly: true,
    secure: env.APP_URL.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return { ok: true, url: state.url };
}

/** Desvincula o Google. Reautentica e bloqueia se deixaria a conta sem nenhum
 * meio de login (sem senha e sem outro vínculo). */
export async function unlinkGoogleAction(input: unknown): Promise<Result> {
  let session;
  try { session = await requireUser(); } catch { return { ok: false, error: "Faça login." }; }

  const rl = await checkRateLimit(`oauthlink:${session.id}`, 8, 10 * 60_000);
  if (!rl.ok) return { ok: false, error: "Muitas tentativas. Aguarde." };

  const parsed = PwdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Conta não encontrada." };

  const hasPassword = user.passwordHash !== "";
  const oauthCount = await countOAuthAccounts(user.id);
  // Após desvincular o Google, sobra algum meio de login?
  const remaining = (hasPassword ? 1 : 0) + (oauthCount - 1);
  if (remaining < 1) {
    return { ok: false, error: "Defina uma senha antes de desconectar o Google — senão você ficaria sem como entrar." };
  }

  // Reautenticação por senha (contas só-Google já foram barradas acima).
  if (hasPassword) {
    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) return { ok: false, error: "Senha incorreta." };
  }

  await unlinkGoogle(user.id);
  return { ok: true };
}
