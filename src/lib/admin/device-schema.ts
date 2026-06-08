import { z } from "zod";

const optStr = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optNum = (min: number, max: number) =>
  z.coerce.number().int().min(min).max(max).nullish();
const optFloat = (min: number, max: number) =>
  z.coerce.number().min(min).max(max).nullish();

export const SpecSchema = z.object({
  cpu: optStr(160),
  gpu: optStr(160),
  ramGb: optFloat(0, 64),
  ramType: optStr(60),
  storage: optStr(120),
  os: optStr(120),
  screenSize: optFloat(0, 20),
  resolution: optStr(40),
  aspectRatio: optStr(40),
  refreshHz: optNum(0, 480),
  panelType: optStr(40),
  batteryMah: optNum(0, 30000),
  cooling: z.boolean().default(false),
  vibration: z.boolean().default(false),
  wifi: z.boolean().default(false),
  bluetooth: z.boolean().default(false),
  videoOut: z.boolean().default(false),
  audioJack: z.boolean().default(false),
  usbC: z.boolean().default(false),
  sdCard: z.boolean().default(false),
  analogs: z.boolean().default(false),
  hallEffect: z.boolean().default(false),
  analogTriggers: z.boolean().default(false),
  l1r1: z.boolean().default(false),
  l2r2: z.boolean().default(false),
  l3r3: z.boolean().default(false),
  touchScreen: z.boolean().default(false),
  gyroscope: z.boolean().default(false),
});

export const DeviceFormSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido")
    .max(120)
    .optional()
    .or(z.literal("")),
  manufacturer: z.string().trim().min(1).max(120),
  releaseYear: optNum(1990, 2100),
  priceUsd: optNum(0, 5000),
  formFactor: z.enum(["vertical", "horizontal", "clamshell", "other"]),
  status: z.enum(["draft", "published", "archived"]),
  description: optStr(2000),
  priceRange: optStr(120),
  pros: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  cons: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  frontImageUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  frontImageAlt: optStr(300),
  spec: SpecSchema,
  emulation: z
    .array(z.object({ system: z.string().trim().min(1).max(40), score: z.coerce.number().int().min(0).max(100) }))
    .max(40)
    .default([]),
});

export type DeviceFormInput = z.input<typeof DeviceFormSchema>;
export type DeviceFormValues = z.infer<typeof DeviceFormSchema>;
