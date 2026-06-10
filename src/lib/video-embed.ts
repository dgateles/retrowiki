// Allowlist de provedores de vídeo. O embed é construído por NÓS a partir de um
// ID validado (não de HTML do usuário), então o iframe é seguro.

export type VideoEmbed = { provider: "youtube" | "vimeo"; id: string; src: string };

const YT = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d{6,12})/;

/** Extrai provedor + ID de uma URL de YouTube/Vimeo. Retorna null se não for de
 * um provedor da allowlist. */
export function parseVideoEmbed(url: string): VideoEmbed | null {
  const u = String(url ?? "").trim();
  const yt = u.match(YT);
  if (yt) return { provider: "youtube", id: yt[1], src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vi = u.match(VIMEO);
  if (vi) return { provider: "vimeo", id: vi[1], src: `https://player.vimeo.com/video/${vi[1]}` };
  return null;
}
