import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ipGeo } from "@/db/schema";

function isPrivateOrLocal(ip: string): boolean {
  if (!ip || ip === "desconhecido" || ip === "0") return true;
  if (ip === "::1" || ip.startsWith("127.")) return true;
  if (/^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (/^(fc|fd|fe80)/i.test(ip)) return true;
  return false;
}

function join(parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(", ").slice(0, 160);
}

// Primário: ipwho.is (escolha do projeto). O plano gratuito bloqueia o fetch
// server-side (403 "CORS not supported"), então caímos para o ip-api.com.
async function fromIpWho(ip: string): Promise<string> {
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return "";
    const j = (await res.json()) as { success?: boolean; city?: string; region?: string; country?: string };
    if (!j.success) return "";
    return join([j.city, j.region, j.country]);
  } catch {
    return "";
  }
}

async function fromIpApi(ip: string): Promise<string> {
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,city,regionName,country`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return "";
    const j = (await res.json()) as { status?: string; city?: string; regionName?: string; country?: string };
    if (j.status !== "success") return "";
    return join([j.city, j.regionName, j.country]);
  } catch {
    return "";
  }
}

async function fetchGeo(ip: string): Promise<string> {
  return (await fromIpWho(ip)) || (await fromIpApi(ip));
}

/** Geolocalização (cidade, região, país) de um IP, com cache em ip_geo. Só
 * cacheia resultados não vazios, para uma falha transitória poder tentar de novo. */
export async function geoForIp(ip: string): Promise<string> {
  if (isPrivateOrLocal(ip)) return "Local/privado";
  try {
    const [cached] = await db.select({ label: ipGeo.label }).from(ipGeo).where(eq(ipGeo.ip, ip)).limit(1);
    if (cached && cached.label) return cached.label;
    const label = await fetchGeo(ip);
    if (label) await db.insert(ipGeo).values({ ip, label }).onDuplicateKeyUpdate({ set: { label } });
    return label;
  } catch {
    return "";
  }
}

/** Resolve a geo de vários IPs (cache + fetch dos faltantes). */
export async function geoForIps(ips: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const ip of [...new Set(ips)]) out.set(ip, await geoForIp(ip));
  return out;
}
