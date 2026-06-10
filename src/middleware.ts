import { NextRequest, NextResponse } from "next/server";

/**
 * Content-Security-Policy baseada em nonce (padrão do Next.js App Router).
 * O Next injeta o nonce nos próprios scripts quando a CSP está nos headers da
 * requisição. Recursos externos são travados em 'self', exceto imagens (BunnyCDN
 * e avatares externos via https/data/blob) e estilos inline do React.
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";

  const csp = [
    `default-src 'self'`,
    // 'strict-dynamic' ignora a allowlist de host; só scripts com nonce (e os que
    // eles carregam) rodam. 'unsafe-eval' apenas em dev (React Refresh).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`, // estilos inline do React (style={{}})
    `img-src 'self' data: blob: https:`, // BunnyCDN + avatares externos
    `font-src 'self'`,
    `connect-src 'self'`,
    `worker-src 'self'`, // RetroGuard (/retroguard-worker.js)
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Aplica a páginas; pula assets estáticos, imagens do Next e arquivos com extensão.
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
