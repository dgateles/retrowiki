import "server-only";

const REGION = process.env.BUNNY_STORAGE_REGION || "";
const ZONE = process.env.BUNNY_PULL_ZONE || "";
const KEY = process.env.BUNNY_STORAGE_KEY || "";
const CDN = (process.env.BUNNY_CDN_URL || "").replace(/\/+$/, "");

export function isBunnyConfigured(): boolean {
  return Boolean(ZONE && KEY && CDN);
}

function storageBase(): string {
  const host = REGION ? `${REGION}.storage.bunnycdn.com` : "storage.bunnycdn.com";
  return `https://${host}/${ZONE}`;
}

/** URL pública (Pull Zone) de um caminho no storage. */
export function bunnyPublicUrl(path: string): string {
  return `${CDN}/${path.replace(/^\/+/, "")}`;
}

/** Confere se uma URL pertence ao nosso Pull Zone (para sanitização). */
export function isBunnyUrl(url: string): boolean {
  return Boolean(CDN) && url.startsWith(`${CDN}/`);
}

/** Sobe bytes para o Bunny Storage e devolve a URL pública. */
export async function uploadToBunny(path: string, bytes: Uint8Array, contentType: string): Promise<string> {
  if (!isBunnyConfigured()) throw new Error("BUNNY_NOT_CONFIGURED");
  const clean = path.replace(/^\/+/, "");
  const res = await fetch(`${storageBase()}/${clean}`, {
    method: "PUT",
    headers: { AccessKey: KEY, "Content-Type": contentType },
    body: bytes as unknown as BodyInit,
  });
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`BUNNY_UPLOAD_${res.status}`);
  }
  return bunnyPublicUrl(clean);
}

/** Remove um arquivo do storage (best-effort). */
export async function deleteFromBunny(pathOrUrl: string): Promise<void> {
  if (!isBunnyConfigured()) return;
  let path = pathOrUrl;
  if (CDN && pathOrUrl.startsWith(`${CDN}/`)) path = pathOrUrl.slice(CDN.length + 1);
  const clean = path.replace(/^\/+/, "");
  if (!clean) return;
  await fetch(`${storageBase()}/${clean}`, { method: "DELETE", headers: { AccessKey: KEY } }).catch(() => {});
}

// ── Validação de imagem (raster, por magic bytes; SVG é recusado) ─────────

export type ImageKind = { ext: string; contentType: string };

export function sniffImage(bytes: Uint8Array): ImageKind | null {
  const b = bytes;
  if (b.length < 12) return null;
  // PNG
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", contentType: "image/png" };
  // JPEG
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", contentType: "image/jpeg" };
  // GIF
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return { ext: "gif", contentType: "image/gif" };
  // WEBP (RIFF....WEBP)
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return { ext: "webp", contentType: "image/webp" };
  }
  return null;
}
