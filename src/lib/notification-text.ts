type Payload = { slug?: string; title?: string; reason?: string } | null | unknown;

function asPayload(p: unknown): { slug?: string; title?: string; reason?: string } {
  return (p && typeof p === "object" ? p : {}) as { slug?: string; title?: string; reason?: string };
}

/** Texto e link de uma notificação a partir do tipo e payload. */
export function describeNotification(type: string, payloadRaw: unknown): { text: string; href?: string } {
  const p = asPayload(payloadRaw);
  const title = p.title ?? "seu conteúdo";
  const href = p.slug ? `/guias/${p.slug}` : undefined;

  switch (type) {
    case "article.approved":
      return { text: `"${title}" foi aprovado e publicado.`, href };
    case "article.changes_requested":
      return { text: `"${title}" precisa de ajustes${p.reason ? `: ${p.reason}` : "."}`, href };
    case "article.rejected":
      return { text: `"${title}" foi rejeitado${p.reason ? `: ${p.reason}` : "."}`, href };
    case "comment.reply":
      return { text: `Novo comentário em "${title}".`, href };
    case "comment.quote":
      return { text: `Responderam ao seu comentário em "${title}".`, href };
    case "submission.received":
      return { text: `Nova submissão na fila: "${title}".`, href: "/moderacao" };
    default:
      return { text: `Atualização em "${title}".`, href };
  }
}
