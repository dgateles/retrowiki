/** Rotas do fórum centralizadas (evita espalhar `/forum/${slug}` pelo código). */
export function forumHref(forumSlug: string): string {
  return `/forum/${forumSlug}`;
}

export function topicHref(forumSlug: string, topicSlug: string): string {
  return `/forum/${forumSlug}/${topicSlug}`;
}

/** Caminho direto para um post do tópico (âncora #post-{id}). */
export function postHref(forumSlug: string, topicSlug: string, postId: number | string): string {
  return `${topicHref(forumSlug, topicSlug)}#post-${postId}`;
}
