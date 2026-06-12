// Validação de URL reutilizável (sem dependências de servidor — usada no
// schema Zod e no render). Bloqueia javascript:/data:, URLs protocol-relative
// (//evil.com) e o truque de barra invertida (/\evil.com) que os navegadores
// normalizam para protocol-relative — fechando open redirect e carga off-domain.

/** Caminho interno seguro: uma única barra inicial, não seguida de / ou \. */
const INTERNAL_PATH = /^\/(?![/\\])/;

/** Link permitido: http(s) absoluto, âncora, mailto, ou caminho interno. */
export function isSafeHref(value: string): boolean {
  const h = value.trim();
  return /^https?:\/\//i.test(h) || h.startsWith("#") || h.startsWith("mailto:") || INTERNAL_PATH.test(h);
}

/** Fonte de imagem permitida: https absoluto ou caminho interno (sem // nem /\). */
export function isSafeImageSrc(value: string): boolean {
  const u = value.trim();
  return /^https:\/\//i.test(u) || INTERNAL_PATH.test(u);
}
