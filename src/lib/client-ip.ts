/**
 * IP do cliente a partir dos cabeçalhos de proxy, resistente a spoofing.
 *
 * O `X-Forwarded-For` é uma LISTA: cada proxy anexa o IP de quem falou com ele ao
 * FINAL. Atrás do nosso proxy reverso (Traefik), a última entrada é o IP real do
 * socket que chegou no proxy — as entradas à esquerda podem ter sido injetadas
 * pelo próprio cliente. Confiar na 1ª entrada (como era antes) deixava qualquer um
 * forjar o IP e burlar rate-limit, log de IPs e ban por IP. Aqui pegamos a entrada
 * MAIS À DIREITA (com fallback para `X-Real-Ip`, que o Traefik também define).
 *
 * Observação: se um dia entrar outro proxy na frente (ex.: Cloudflare), este helper
 * precisa passar a considerar a contagem de proxies confiáveis.
 */
export function clientIpFromXff(xff: string | null | undefined, xRealIp?: string | null): string {
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return (xRealIp ?? "").trim();
}
