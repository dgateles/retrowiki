import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import {
  categories,
  users,
  devices,
  deviceSpecs,
  emulationScores,
  deviceImages,
} from "./schema";
import { slugify } from "../lib/utils";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CATEGORIES = [
  { slug: "staff-pick", label: "Staff Pick", kind: "rating" as const },
  { slug: "android", label: "Android", kind: "os" as const },
  { slug: "linux", label: "Linux", kind: "os" as const },
  { slug: "powerfull", label: "Potente", kind: "power" as const },
  { slug: "budget", label: "Custo-benefício", kind: "power" as const },
];

type SeedDevice = {
  slug: string;
  name: string;
  manufacturer: string;
  releaseYear: number | null;
  formFactor: "vertical" | "horizontal" | "clamshell" | "other";
  extra: unknown;
  spec: Record<string, unknown>;
  emulation: { system: string; score: number }[];
  image: { url: string; alt: string } | null;
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required.");
  const connection = await mysql.createConnection({ uri: url });
  const db = drizzle(connection, { casing: "snake_case" });

  let order = 0;
  for (const c of CATEGORIES) {
    await db.insert(categories).values({ ...c, sortOrder: order++ }).catch(() => {});
  }

  const data: SeedDevice[] = JSON.parse(
    readFileSync(join(__dirname, "seed-data", "devices.json"), "utf8"),
  );

  for (const d of data) {
    const [existing] = await db
      .select({ id: devices.id })
      .from(devices)
      .where(eq(devices.slug, d.slug))
      .limit(1);
    if (existing) continue;

    const [res] = await db.insert(devices).values({
      slug: d.slug,
      name: d.name,
      manufacturer: d.manufacturer,
      releaseYear: d.releaseYear ?? undefined,
      formFactor: d.formFactor,
      status: "published",
      extra: d.extra as object,
    });
    const deviceId = (res as unknown as { insertId: number }).insertId;

    await db.insert(deviceSpecs).values({ deviceId, ...(d.spec as object) }).catch(() => {});
    for (const e of d.emulation) {
      await db.insert(emulationScores).values({ deviceId, system: e.system, score: e.score }).catch(() => {});
    }
    if (d.image) {
      await db.insert(deviceImages).values({
        deviceId,
        url: d.image.url,
        kind: "front",
        alt: d.image.alt,
      }).catch(() => {});
    }
    console.log(`device: ${d.slug}`);
  }

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (!existing) {
      const passwordHash = await bcrypt.hash(password, 12);
      await db.insert(users).values({
        email: email.toLowerCase(),
        handle: slugify(email.split("@")[0]) || "admin",
        displayName: "Administrador",
        passwordHash,
        role: "admin",
        emailVerifiedAt: new Date(),
      });
    }
  }

  console.log("Seed completo.");
  await connection.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
