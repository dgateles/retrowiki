import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
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
  articles,
  revisions,
  githubRepos,
} from "./schema";
import { slugify } from "../lib/utils";
import { blockTreeToText, type BlockTree } from "../lib/blocks/schema";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = (f: string) => join(__dirname, "seed-data", f);
const readJson = (f: string) => (existsSync(dataPath(f)) ? JSON.parse(readFileSync(dataPath(f), "utf8")) : null);

const CATEGORIES = [
  { slug: "staff-pick", label: "Staff Pick", kind: "rating" as const },
  { slug: "android", label: "Android", kind: "os" as const },
  { slug: "linux", label: "Linux", kind: "os" as const },
  { slug: "powerfull", label: "Potente", kind: "power" as const },
  { slug: "budget", label: "Custo-benefício", kind: "power" as const },
];

type Db = MySql2Database<Record<string, never>>;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required.");
  const connection = await mysql.createConnection({ uri: url, charset: "utf8mb4" });
  const db = drizzle(connection, { casing: "snake_case" });

  let order = 0;
  for (const c of CATEGORIES) {
    await db.insert(categories).values({ ...c, sortOrder: order++ }).catch(() => {});
  }

  await seedDevices(db);
  await seedGithubRepos(db);
  const systemId = await ensureSystemAuthor(db);
  await seedArticles(db, systemId);
  await seedAdmin(db);

  console.log("Seed completo.");
  await connection.end();
  process.exit(0);
}

async function seedDevices(db: Db) {
  const data = readJson("devices.json");
  if (!data) return;
  for (const d of data) {
    const [existing] = await db.select({ id: devices.id }).from(devices).where(eq(devices.slug, d.slug)).limit(1);
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
      await db.insert(deviceImages).values({ deviceId, url: d.image.url, kind: "front", alt: d.image.alt }).catch(() => {});
    }
  }
  console.log("devices ok");
}

async function seedGithubRepos(db: Db) {
  const data = readJson("github-repos.json");
  if (!data) return;
  for (const r of data) {
    await db.insert(githubRepos).values({ owner: r.owner, repo: r.repo }).catch(() => {});
  }
  console.log(`github_repos: ${data.length}`);
}

async function ensureSystemAuthor(db: Db): Promise<number> {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.handle, "retrowiki")).limit(1);
  if (existing) return existing.id;
  const passwordHash = await bcrypt.hash(slugify(String(Date.now())) + "Rw!", 12);
  const [res] = await db.insert(users).values({
    email: "conteudo@retrowiki.local",
    handle: "retrowiki",
    displayName: "Equipe RetroWiki",
    passwordHash,
    role: "admin",
    emailVerifiedAt: new Date(),
  });
  return (res as unknown as { insertId: number }).insertId;
}

async function seedArticles(db: Db, authorId: number) {
  const data: {
    slug: string;
    deviceSlug: string;
    type: string;
    title: string;
    summary: string | null;
    body: BlockTree;
  }[] = readJson("articles.json");
  if (!data) return;

  const devs = await db.select({ id: devices.id, slug: devices.slug }).from(devices);
  const idBySlug = new Map(devs.map((d) => [d.slug, d.id]));

  let n = 0;
  for (const a of data) {
    const [existing] = await db
      .select({ id: articles.id, authorId: articles.authorId })
      .from(articles)
      .where(eq(articles.slug, a.slug))
      .limit(1);

    // Já existe: se for conteúdo migrado (autor de sistema), atualiza o corpo.
    if (existing) {
      if (existing.authorId === authorId) {
        const [rev] = await db.insert(revisions).values({ articleId: existing.id, body: a.body, editorId: authorId });
        const revisionId = (rev as unknown as { insertId: number }).insertId;
        await db
          .update(articles)
          .set({
            title: a.title,
            summary: a.summary ?? undefined,
            type: a.type as "tutorial",
            deviceId: idBySlug.get(a.deviceSlug) ?? null,
            currentRevisionId: revisionId,
            searchText: blockTreeToText(a.body),
          })
          .where(eq(articles.id, existing.id));
        n++;
      }
      continue;
    }

    const [res] = await db.insert(articles).values({
      slug: a.slug,
      type: a.type as "tutorial",
      title: a.title,
      summary: a.summary ?? undefined,
      deviceId: idBySlug.get(a.deviceSlug) ?? null,
      authorId,
      status: "published",
      searchText: blockTreeToText(a.body),
      publishedAt: new Date(),
    });
    const articleId = (res as unknown as { insertId: number }).insertId;
    const [rev] = await db.insert(revisions).values({ articleId, body: a.body, editorId: authorId });
    const revisionId = (rev as unknown as { insertId: number }).insertId;
    await db.update(articles).set({ currentRevisionId: revisionId }).where(eq(articles.id, articleId));
    n++;
  }
  console.log(`articles: ${n}`);
}

async function seedAdmin(db: Db) {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) return;
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (existing) return;
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

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
