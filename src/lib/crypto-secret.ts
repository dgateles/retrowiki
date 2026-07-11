import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { env } from "@/lib/env";

// Chave de 32 bytes derivada do AUTH_SECRET (não é o próprio segredo).
const key = createHash("sha256").update(`mfa:${env.AUTH_SECRET}`).digest();

/** Cifra um texto (AES-256-GCM) para guardar no banco. Formato: iv.tag.dados (base64). */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
}

/** Decifra o valor guardado; null se adulterado/inválido. */
export function decryptSecret(payload: string): string | null {
  try {
    const [ivB, tagB, encB] = payload.split(".");
    if (!ivB || !tagB || !encB) return null;
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB, "base64"));
    decipher.setAuthTag(Buffer.from(tagB, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(encB, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
