import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { requireUser, getCurrentUser } from "@/lib/auth-helpers";
import { isBanned } from "@/lib/admin/ban-filters";
import { getClientIp } from "@/lib/ip";
import { env } from "@/lib/env";
import { consumeLinkState, fetchGoogleIdentity, linkGoogleToUser, LINK_COOKIE } from "@/lib/oauth-link";

/** Volta para o painel com um status (caminho relativo fixo — sem open redirect). */
function back(status: string): NextResponse {
  const url = new URL(`/conta?secao=contas&vinculo=${status}`, env.APP_URL);
  const res = NextResponse.redirect(url);
  res.cookies.delete(LINK_COOKIE);
  return res;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Exige sessão ativa (revalida suspensão/sessionVersion contra o banco).
  let session;
  try { session = await requireUser(); } catch {
    return NextResponse.redirect(new URL("/auth/entrar", env.APP_URL));
  }
  const userId = Number(session.id);

  const sp = req.nextUrl.searchParams;
  if (sp.get("error")) return back("cancelado");
  const code = sp.get("code");
  const state = sp.get("state");
  if (!code || !state) return back("erro");

  // CSRF: o `state` precisa bater com o cookie gravado no início.
  const cookieState = (await cookies()).get(LINK_COOKIE)?.value;
  if (!cookieState || cookieState !== state) return back("erro");

  // Consome o state (uso único): confere dono + expiração e apaga.
  const codeVerifier = await consumeLinkState(state, userId);
  if (!codeVerifier) return back("erro");

  // Rechecagem de banido/suspenso contra a conta atual.
  const user = await getCurrentUser();
  if (!user) return back("erro");
  if (user.isSuspended || (await isBanned({ email: user.email, ip: await getClientIp() }))) return back("erro");

  const identity = await fetchGoogleIdentity(code, codeVerifier);
  if (!identity) return back("erro");
  if (!identity.emailVerified) return back("naoverificado");

  const result = await linkGoogleToUser(userId, identity.sub, identity.email);
  if (result === "conflict") return back("conflito");
  return back("ok");
}
