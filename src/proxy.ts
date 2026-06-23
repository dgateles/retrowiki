import { NextResponse, type NextRequest } from "next/server";

// Domínio canônico (= APP_URL/AUTH_URL). Acessos pelo domínio alias precisam ser
// redirecionados para cá ANTES de qualquer fluxo de login.
//
// Por quê: o cookie PKCE do Google (e o cookie de sessão) é host-only e não viaja
// entre domínios registráveis diferentes (retrowiki.com.br ≠ retro.wiki.br). Como
// o AUTH_URL fixa o callback no domínio canônico, iniciar o login no alias gravava
// o verifier em retrowiki.com.br e o callback em retro.wiki.br não o encontrava
// → "InvalidCheck: pkceCodeVerifier value could not be parsed". Compartilhar o
// cookie é impossível (eTLD+1 distintos: com.br vs wiki.br), então a saída é
// canonizar o host. Também remove conteúdo duplicado de SEO.
const CANONICAL_HOST = (() => {
  try {
    return new URL(process.env.APP_URL ?? "https://retro.wiki.br").host;
  } catch {
    return "retro.wiki.br";
  }
})();

// Allowlist explícita: só redirecionamos hosts-alias conhecidos. Assim healthchecks
// internos (IP/host do orquestrador) e o próprio canônico não são afetados.
const ALIAS_HOSTS = new Set(["retrowiki.com.br", "www.retrowiki.com.br"]);

export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (host && host !== CANONICAL_HOST && ALIAS_HOSTS.has(host)) {
    const url = req.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    // 308: permanente e preserva o método (não vira GET num POST de login).
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  // Roda em tudo, menos assets estáticos do Next (não precisam canonizar).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
