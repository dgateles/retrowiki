import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { categories, users } from "./schema";
import { slugify } from "../lib/utils";

const CATEGORIES = [
  { slug: "staff-pick", label: "Staff Pick", kind: "rating" as const },
  { slug: "android", label: "Android", kind: "os" as const },
  { slug: "linux", label: "Linux", kind: "os" as const },
  { slug: "powerfull", label: "Potente", kind: "power" as const },
  { slug: "budget", label: "Custo-benefício", kind: "power" as const },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required.");
  const connection = await mysql.createConnection({ uri: url });
  const db = drizzle(connection, { casing: "snake_case" });

  let order = 0;
  for (const c of CATEGORIES) {
    await db.insert(categories).values({ ...c, sortOrder: order++ }).catch(() => {});
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
