import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { devices, deviceSpecs, emulationScores, deviceImages } from "@/db/schema";
import type { Device, DeviceSpec } from "@/db/schema";

export type DeviceListItem = Device & { frontImage?: string | null };

export type DeviceFilters = {
  manufacturer?: string;
  formFactor?: "vertical" | "horizontal" | "clamshell" | "other";
};

/**
 * Lista devices publicados, com a imagem frontal. Degrada para [] se o banco
 * estiver indisponível (ex.: build estático com DATABASE_URL placeholder).
 */
export async function listDevices(filters: DeviceFilters = {}): Promise<DeviceListItem[]> {
  try {
    const where = [eq(devices.status, "published")];
    if (filters.manufacturer) where.push(eq(devices.manufacturer, filters.manufacturer));
    if (filters.formFactor) where.push(eq(devices.formFactor, filters.formFactor));

    const rows = await db
      .select()
      .from(devices)
      .where(and(...where))
      .orderBy(desc(devices.rating), desc(devices.releaseYear))
      .limit(120);

    const imgs = await db
      .select({ deviceId: deviceImages.deviceId, url: deviceImages.url })
      .from(deviceImages)
      .where(eq(deviceImages.kind, "front"));
    const imgByDevice = new Map(imgs.map((i) => [i.deviceId, i.url]));

    return rows.map((d) => ({ ...d, frontImage: imgByDevice.get(d.id) ?? null }));
  } catch {
    return [];
  }
}

export type DeviceDetail = {
  device: Device;
  spec: DeviceSpec | null;
  emulation: { system: string; score: number }[];
  images: { url: string; alt: string }[];
};

export async function getDeviceBySlug(slug: string): Promise<DeviceDetail | null> {
  try {
    const [device] = await db.select().from(devices).where(eq(devices.slug, slug)).limit(1);
    if (!device) return null;

    const [spec] = await db
      .select()
      .from(deviceSpecs)
      .where(eq(deviceSpecs.deviceId, device.id))
      .limit(1);
    const emulation = await db
      .select({ system: emulationScores.system, score: emulationScores.score })
      .from(emulationScores)
      .where(eq(emulationScores.deviceId, device.id));
    const images = await db
      .select({ url: deviceImages.url, alt: deviceImages.alt })
      .from(deviceImages)
      .where(eq(deviceImages.deviceId, device.id));

    return { device, spec: spec ?? null, emulation, images };
  } catch {
    return null;
  }
}

export async function listManufacturers(): Promise<string[]> {
  try {
    const rows = await db
      .selectDistinct({ manufacturer: devices.manufacturer })
      .from(devices)
      .where(eq(devices.status, "published"));
    return rows.map((r) => r.manufacturer).sort((a, b) => a.localeCompare(b, "pt-BR"));
  } catch {
    return [];
  }
}
