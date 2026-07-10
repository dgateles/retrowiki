type Payload = {
  slug?: string;
  kind?: "guide" | "blog"; // rota do artigo: guia (/guias) ou post de blog (/blog)
  title?: string;
  reason?: string;
  commentId?: number;
  actorName?: string;
  actorAvatar?: string | null;
  name?: string; // badge
  roleLabel?: string; // promoção
  rankLabel?: string; // subida de rank
  decision?: string; // denúncia resolvida
  forumSlug?: string; // fórum
  topicSlug?: string;
  topicTitle?: string;
  postId?: number;
  conversationId?: number; // mensagens privadas
  subject?: string;
};

function asPayload(p: unknown): Payload {
  return (p && typeof p === "object" ? p : {}) as Payload;
}

export type NotificationView = { text: string; href?: string; image?: string | null; actor?: string };

/** Texto, link, avatar e autor de uma notificação a partir do tipo e payload. */
export function describeNotification(type: string, payloadRaw: unknown): NotificationView {
  const p = asPayload(payloadRaw);
  const title = p.title ?? "seu conteúdo";
  // Rota conforme o tipo do artigo; sem `kind` (notificações antigas) assume guia.
  const base = p.slug ? `/${p.kind === "blog" ? "blog" : "guias"}/${p.slug}` : undefined;
  const articleHref = base;
  const commentHref = base
    ? `${base}${p.commentId ? `#comentario-${p.commentId}` : ""}`
    : undefined;
  const actor = p.actorName ?? "Alguém";
  const forumTopicHref = p.forumSlug && p.topicSlug
    ? `/forum/${p.forumSlug}/${p.topicSlug}${p.postId ? `#post-${p.postId}` : ""}`
    : undefined;

  switch (type) {
    case "forum.reply":
      return { text: `${actor} respondeu em "${p.topicTitle ?? "um tópico"}".`, href: forumTopicHref, image: p.actorAvatar, actor };
    case "forum.solution":
      return { text: `Sua resposta foi marcada como solução em "${p.topicTitle ?? "uma pergunta"}".`, href: forumTopicHref, image: p.actorAvatar, actor };
    case "forum.mention":
      return { text: `${actor} mencionou você em "${p.topicTitle ?? "um tópico"}".`, href: forumTopicHref, image: p.actorAvatar, actor };
    case "pm.received":
      return { text: `${actor} enviou uma mensagem${p.subject ? `: "${p.subject}"` : ""}.`, href: p.conversationId ? `/mensagens/${p.conversationId}` : "/mensagens", actor };
    case "pm.reply":
      return { text: `${actor} respondeu em "${p.subject ?? "uma conversa"}".`, href: p.conversationId ? `/mensagens/${p.conversationId}` : "/mensagens", actor };
    case "article.approved":
      return { text: `"${title}" foi aprovado e publicado.`, href: articleHref };
    case "article.changes_requested":
      return { text: `"${title}" precisa de ajustes${p.reason ? `: ${p.reason}` : "."}`, href: articleHref };
    case "article.rejected":
      return { text: `"${title}" foi rejeitado${p.reason ? `: ${p.reason}` : "."}`, href: articleHref };
    case "article.edit_proposed":
      return { text: `Alguém sugeriu uma edição em "${title}". Aguarda revisão da moderação.`, href: articleHref };
    case "comment.reply":
      return { text: `${actor} comentou em "${title}".`, href: commentHref, image: p.actorAvatar, actor };
    case "comment.quote":
      return { text: `${actor} respondeu ao seu comentário em "${title}".`, href: commentHref, image: p.actorAvatar, actor };
    case "submission.received":
      return { text: `Nova submissão na fila: "${title}".`, href: "/moderacao" };
    case "badge.earned":
      return { text: `Você conquistou a badge "${p.name ?? "nova"}".`, href: "/painel" };
    case "rank.up":
      return { text: `Você subiu para o rank ${p.rankLabel ?? "novo"}.`, href: "/painel" };
    case "quest.completed":
      return { text: `Você concluiu a missão "${title}".`, href: "/missoes" };
    case "role.promoted":
      return { text: `Você foi promovido a ${p.roleLabel ?? "um novo papel"}.`, href: "/painel" };
    case "report.resolved":
      return { text: p.decision === "completed" ? "Um conteúdo seu foi removido após denúncias." : "Uma denúncia sobre seu conteúdo foi analisada e arquivada." };
    default:
      return { text: `Atualização em "${title}".`, href: articleHref };
  }
}
