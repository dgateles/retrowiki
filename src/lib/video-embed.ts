// Allowlist de provedores de vídeo. O embed é construído por NÓS a partir de um
// ID validado (não de HTML do usuário), então o iframe é seguro.

export type VideoEmbed = { provider: "youtube" | "vimeo" | "twitch"; id: string; src: string };

const YT = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/;
const VIMEO = /(?:player\.)?vimeo\.com\/(?:video\/)?(\d{6,12})/;
const TWITCH_VIDEO = /twitch\.tv\/videos\/(\d{6,12})/;
const TWITCH_CLIP = /clips\.twitch\.tv\/(?:embed\?clip=)?([A-Za-z0-9_-]{3,100})/;
const TWITCH_CHANNEL_CLIP = /twitch\.tv\/[A-Za-z0-9_]+\/clip\/([A-Za-z0-9_-]{3,100})/;

// O player do Twitch exige o parâmetro `parent` com os domínios que embedam.
const TWITCH_PARENTS = ["retro.wiki.br", "retrowiki.com.br", "localhost"]
  .map((p) => `parent=${p}`)
  .join("&");

/** Extrai provedor + ID de uma URL de YouTube/Vimeo/Twitch. Retorna null se não
 * for de um provedor da allowlist. */
export function parseVideoEmbed(url: string): VideoEmbed | null {
  const u = String(url ?? "").trim();

  const yt = u.match(YT);
  if (yt) return { provider: "youtube", id: yt[1], src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };

  const vi = u.match(VIMEO);
  if (vi) return { provider: "vimeo", id: vi[1], src: `https://player.vimeo.com/video/${vi[1]}` };

  const tv = u.match(TWITCH_VIDEO);
  if (tv) return { provider: "twitch", id: tv[1], src: `https://player.twitch.tv/?video=${tv[1]}&${TWITCH_PARENTS}` };

  const tc = u.match(TWITCH_CHANNEL_CLIP) ?? u.match(TWITCH_CLIP);
  if (tc) return { provider: "twitch", id: tc[1], src: `https://clips.twitch.tv/embed?clip=${tc[1]}&${TWITCH_PARENTS}` };

  return null;
}

export const VIDEO_PROVIDER_LABEL: Record<VideoEmbed["provider"], string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  twitch: "Twitch",
};
