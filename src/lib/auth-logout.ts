import { signOut } from "next-auth/react";

/**
 * Encerra a sessão e volta para a home. Faz a navegação no cliente
 * (`window.location`) em vez de deixar o NextAuth montar a URL de redirect no
 * servidor — atrás de proxy/Coolify, essa inferência podia gerar
 * `http://0.0.0.0:3000` (host de bind interno) quando os headers de
 * X-Forwarded-Host/Proto não chegam corretos. No cliente, a origem é sempre a
 * do domínio acessado.
 */
export async function appSignOut(): Promise<void> {
  await signOut({ redirect: false });
  window.location.assign("/");
}
