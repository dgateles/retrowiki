/** Caminho público de um artigo conforme o tipo: post de blog (/blog) ou guia
 * (/guias). Centraliza o roteamento para não espalhar `/guias/${slug}` (que
 * quebrava links de blog → 404 e atrapalhava o SEO de links internos). Sem
 * `kind` definido, assume guia (compatível com dados antigos). */
export function articleHref(kind: string | null | undefined, slug: string): string {
  return `/${kind === "blog" ? "blog" : "guias"}/${slug}`;
}

/** Caminho direto para um comentário do artigo (âncora). */
export function commentHref(kind: string | null | undefined, slug: string, commentId: number | string): string {
  return `${articleHref(kind, slug)}#comentario-${commentId}`;
}
