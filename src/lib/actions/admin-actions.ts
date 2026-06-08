"use server";

import { eq, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { devices, deviceSpecs, emulationScores, deviceImages, auditLog } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { slugify } from "@/lib/utils";
import { DeviceFormSchema, type DeviceFormInput } from "@/lib/admin/device-schema";

type Result = { ok: true; data: { id: number; slug: string } } | { ok: false; error: string };

function nz(s: string | undefined | null): string | null {
  const v = (s ?? "").trim();
  return v ? v : null;
}

function buildExtra(v: { description?: string; priceRange?: string; pros: string[]; cons: string[] }) {
  const extra: Record<string, unknown> = {};
  if (nz(v.description)) extra.description = v.description!.trim();
  if (nz(v.priceRange)) extra.priceRange = v.priceRange!.trim();
  if (v.pros.length) extra.pros = v.pros.map((text) => ({ text }));
  if (v.cons.length) extra.cons = v.cons.map((text) => ({ text }));
  return extra;
}

function specValues(deviceId: number, s: ReturnType<typeof DeviceFormSchema.parse>["spec"]) {
  return {
    deviceId,
    cpu: nz(s.cpu), gpu: nz(s.gpu),
    ramGb: s.ramGb ?? null, ramType: nz(s.ramType), storage: nz(s.storage),
    os: nz(s.os), screenSize: s.screenSize ?? null, resolution: nz(s.resolution),
    aspectRatio: nz(s.aspectRatio), refreshHz: s.refreshHz ?? null, panelType: nz(s.panelType),
    batteryMah: s.batteryMah ?? null,
    cooling: s.cooling, vibration: s.vibration, wifi: s.wifi, bluetooth: s.bluetooth,
    videoOut: s.videoOut, audioJack: s.audioJack, usbC: s.usbC, sdCard: s.sdCard,
    analogs: s.analogs, hallEffect: s.hallEffect, analogTriggers: s.analogTriggers,
    l1r1: s.l1r1, l2r2: s.l2r2, l3r3: s.l3r3, touchScreen: s.touchScreen, gyroscope: s.gyroscope,
  };
}

async function replaceChildren(deviceId: number, v: ReturnType<typeof DeviceFormSchema.parse>) {
  // spec: apaga e recria (1:1)
  await db.delete(deviceSpecs).where(eq(deviceSpecs.deviceId, deviceId));
  await db.insert(deviceSpecs).values(specValues(deviceId, v.spec));

  // emulação: substitui o conjunto
  await db.delete(emulationScores).where(eq(emulationScores.deviceId, deviceId));
  if (v.emulation.length) {
    await db.insert(emulationScores).values(
      v.emulation.map((e) => ({ deviceId, system: e.system, score: e.score })),
    );
  }

  // imagem frontal: substitui a do tipo "front"
  await db.delete(deviceImages).where(and(eq(deviceImages.deviceId, deviceId), eq(deviceImages.kind, "front")));
  if (nz(v.frontImageUrl)) {
    await db.insert(deviceImages).values({
      deviceId,
      url: v.frontImageUrl!.trim(),
      kind: "front",
      alt: nz(v.frontImageAlt) ?? v.name,
    });
  }
}

async function uniqueSlug(base: string, exceptId?: number): Promise<string> {
  let slug = base || "console";
  for (let i = 0; i < 50; i++) {
    const cond = exceptId
      ? and(eq(devices.slug, slug), ne(devices.id, exceptId))
      : eq(devices.slug, slug);
    const [hit] = await db.select({ id: devices.id }).from(devices).where(cond).limit(1);
    if (!hit) return slug;
    slug = `${base}-${i + 2}`;
  }
  throw new Error("slug");
}

export async function createDeviceAction(input: DeviceFormInput): Promise<Result> {
  let actor;
  try {
    actor = await requireRole("admin");
  } catch {
    return { ok: false, error: "Acesso restrito." };
  }

  const parsed = DeviceFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const v = parsed.data;

  try {
    const slug = await uniqueSlug(nz(v.slug) ?? slugify(v.name));
    const [res] = await db.insert(devices).values({
      slug,
      name: v.name,
      manufacturer: v.manufacturer,
      releaseYear: v.releaseYear ?? null,
      priceUsd: v.priceUsd ?? null,
      formFactor: v.formFactor,
      status: v.status,
      extra: buildExtra(v),
    });
    const id = (res as unknown as { insertId: number }).insertId;
    await replaceChildren(id, v);

    await db.insert(auditLog).values({
      actorId: Number(actor.id),
      action: "device_create",
      target: `device:${id}`,
      meta: { slug },
    });

    revalidatePath("/admin/consoles");
    revalidatePath("/consoles");
    revalidatePath(`/consoles/${slug}`);
    return { ok: true, data: { id, slug } };
  } catch {
    return { ok: false, error: "Falha ao criar o console." };
  }
}

export async function updateDeviceAction(id: number, input: DeviceFormInput): Promise<Result> {
  let actor;
  try {
    actor = await requireRole("admin");
  } catch {
    return { ok: false, error: "Acesso restrito." };
  }

  const parsed = DeviceFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const v = parsed.data;

  try {
    const [existing] = await db.select({ id: devices.id }).from(devices).where(eq(devices.id, id)).limit(1);
    if (!existing) return { ok: false, error: "Console não encontrado." };

    const slug = await uniqueSlug(nz(v.slug) ?? slugify(v.name), id);
    await db
      .update(devices)
      .set({
        slug,
        name: v.name,
        manufacturer: v.manufacturer,
        releaseYear: v.releaseYear ?? null,
        priceUsd: v.priceUsd ?? null,
        formFactor: v.formFactor,
        status: v.status,
        extra: buildExtra(v),
      })
      .where(eq(devices.id, id));
    await replaceChildren(id, v);

    await db.insert(auditLog).values({
      actorId: Number(actor.id),
      action: "device_update",
      target: `device:${id}`,
      meta: { slug },
    });

    revalidatePath("/admin/consoles");
    revalidatePath("/consoles");
    revalidatePath(`/consoles/${slug}`);
    return { ok: true, data: { id, slug } };
  } catch {
    return { ok: false, error: "Falha ao salvar o console." };
  }
}
