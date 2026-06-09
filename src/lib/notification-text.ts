type Payload = {
  slug?: string;
  title?: string;
  reason?: string;
  commentId?: number;
  actorName?: string;
  actorAvatar?: string | null;
};

function asPayload(p: unknown): Payload {
  return (p && typeof p === "object" ? p : {}) as Payload;
}

export type NotificationView = { text: string; href?: string; image?: string | null; actor?: string };

/** Texto, link, avatar e autor de uma notificação a partir do tipo e payload. */
export function describeNotification(type: string, payloadRaw: unknown): NotificationView {
  const p = asPayload(payloadRaw);
  const title = p.title ?? "seu conteúdo";
  const articleHref = p.slug ? `/guias/${p.slug}` : undefined;
  const commentHref = p.slug
    ? `/guias/${p.slug}${p.commentId ? `#comentario-${p.commentId}` : ""}`
    : undefined;
  const actor = p.actorName ?? "Alguém";

  switch (type) {
    case "article.approved":
      return { text: `"${title}" foi aprovado e publicado.`, href: articleHref };
    case "article.changes_requested":
      return { text: `"${title}" precisa de ajustes${p.reason ? `: ${p.reason}` : "."}`, href: articleHref };
    case "article.rejected":
      return { text: `"${title}" foi rejeitado${p.reason ? `: ${p.reason}` : "."}`, href: articleHref };
    case "comment.reply":
      return { text: `${actor} comentou em "${title}".`, href: commentHref, image: p.actorAvatar, actor };
    case "comment.quote":
      return { text: `${actor} respondeu ao seu comentário em "${title}".`, href: commentHref, image: p.actorAvatar, actor };
    case "submission.received":
      return { text: `Nova submissão na fila: "${title}".`, href: "/moderacao" };
    default:
      return { text: `Atualização em "${title}".`, href: articleHref };
  }
}
