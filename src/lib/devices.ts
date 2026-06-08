import "server-only";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { devices } from "@/db/schema";
import type { Device } from "@/db/schema";

/**
 * Lista devices publicados. Degrada para [] se o banco estiver indisponível
 * (ex.: build estático com DATABASE_URL placeholder).
 */
export async function listDevices(): Promise<Device[]> {
  try {
    return await db.select().from(devices).orderBy(desc(devices.rating)).limit(60);
  } catch {
    return [];
  }
}
