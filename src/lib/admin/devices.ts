import "server-only";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { devices, deviceSpecs, emulationScores, deviceImages } from "@/db/schema";
import type { DeviceFormValues } from "./device-schema";

export async function listAllDevices() {
  try {
    return await db
      .select({
        id: devices.id,
        name: devices.name,
        manufacturer: devices.manufacturer,
        slug: devices.slug,
        status: devices.status,
        formFactor: devices.formFactor,
        releaseYear: devices.releaseYear,
      })
      .from(devices)
      .orderBy(desc(devices.updatedAt));
  } catch {
    return [];
  }
}

/** Carrega um device no formato do formulário de admin. */
export async function getDeviceForEdit(id: number): Promise<(DeviceFormValues & { id: number }) | null> {
  const [device] = await db.select().from(devices).where(eq(devices.id, id)).limit(1);
  if (!device) return null;

  const [spec] = await db.select().from(deviceSpecs).where(eq(deviceSpecs.deviceId, id)).limit(1);
  const emu = await db
    .select({ system: emulationScores.system, score: emulationScores.score })
    .from(emulationScores)
    .where(eq(emulationScores.deviceId, id));
  const [front] = await db
    .select({ url: deviceImages.url, alt: deviceImages.alt })
    .from(deviceImages)
    .where(eq(deviceImages.deviceId, id))
    .limit(1);

  const extra = (device.extra ?? {}) as {
    description?: string;
    priceRange?: string;
    pros?: ({ text: string } | string)[];
    cons?: ({ text: string } | string)[];
  };
  const flat = (arr?: ({ text: string } | string)[]) =>
    (arr ?? []).map((p) => (typeof p === "string" ? p : p.text));

  const b = (v: boolean | null | undefined) => Boolean(v);

  return {
    id: device.id,
    name: device.name,
    slug: device.slug,
    manufacturer: device.manufacturer,
    releaseYear: device.releaseYear,
    priceUsd: device.priceUsd,
    formFactor: device.formFactor,
    status: device.status,
    description: extra.description ?? "",
    priceRange: extra.priceRange ?? "",
    pros: flat(extra.pros),
    cons: flat(extra.cons),
    frontImageUrl: front?.url ?? "",
    frontImageAlt: front?.alt ?? "",
    emulation: emu,
    spec: {
      cpu: spec?.cpu ?? "",
      gpu: spec?.gpu ?? "",
      ramGb: spec?.ramGb ?? null,
      ramType: spec?.ramType ?? "",
      storage: spec?.storage ?? "",
      os: spec?.os ?? "",
      screenSize: spec?.screenSize ?? null,
      resolution: spec?.resolution ?? "",
      aspectRatio: spec?.aspectRatio ?? "",
      refreshHz: spec?.refreshHz ?? null,
      panelType: spec?.panelType ?? "",
      batteryMah: spec?.batteryMah ?? null,
      cooling: b(spec?.cooling),
      vibration: b(spec?.vibration),
      wifi: b(spec?.wifi),
      bluetooth: b(spec?.bluetooth),
      videoOut: b(spec?.videoOut),
      audioJack: b(spec?.audioJack),
      usbC: b(spec?.usbC),
      sdCard: b(spec?.sdCard),
      analogs: b(spec?.analogs),
      hallEffect: b(spec?.hallEffect),
      analogTriggers: b(spec?.analogTriggers),
      l1r1: b(spec?.l1r1),
      l2r2: b(spec?.l2r2),
      l3r3: b(spec?.l3r3),
      touchScreen: b(spec?.touchScreen),
      gyroscope: b(spec?.gyroscope),
    },
  };
}
