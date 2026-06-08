// Seed idempotente para a imagem de produção: categorias + devices (do JSON
// bundlado) + admin opcional. SQL cru para não depender de TS/schema compilado.
import { readFileSync, existsSync } from "node:fs";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required to seed.");
  process.exit(1);
}

const camelToSnake = (s) => s.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const CATEGORIES = [
  ["staff-pick", "Staff Pick", "rating"],
  ["android", "Android", "os"],
  ["linux", "Linux", "os"],
  ["powerfull", "Potente", "power"],
  ["budget", "Custo-benefício", "power"],
];

const connection = await mysql.createConnection({ uri: url });

async function seedCategories() {
  let order = 0;
  for (const [slug, label, kind] of CATEGORIES) {
    await connection
      .execute(
        "INSERT IGNORE INTO categories (slug, label, kind, sort_order, created_at) VALUES (?, ?, ?, ?, NOW())",
        [slug, label, kind, order++],
      )
      .catch(() => {});
  }
}

async function seedDevices() {
  const path = "./seed-data/devices.json";
  if (!existsSync(path)) {
    console.log("seed-data/devices.json ausente, pulando devices.");
    return;
  }
  const data = JSON.parse(readFileSync(path, "utf8"));
  for (const d of data) {
    const [rows] = await connection.execute(
      "SELECT id FROM devices WHERE slug = ? LIMIT 1",
      [d.slug],
    );
    if (rows[0]) continue;

    const [res] = await connection.execute(
      "INSERT INTO devices (slug, name, manufacturer, release_year, form_factor, status, extra, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'published', ?, NOW(), NOW())",
      [d.slug, d.name, d.manufacturer, d.releaseYear ?? null, d.formFactor, JSON.stringify(d.extra ?? {})],
    );
    const deviceId = res.insertId;

    const spec = d.spec ?? {};
    const cols = Object.keys(spec).filter((k) => spec[k] !== null && spec[k] !== undefined);
    if (cols.length) {
      const colSql = ["device_id", ...cols.map(camelToSnake)].join(", ");
      const placeholders = ["?", ...cols.map(() => "?")].join(", ");
      const values = [deviceId, ...cols.map((k) => spec[k])];
      await connection
        .execute(`INSERT INTO device_specs (${colSql}) VALUES (${placeholders})`, values)
        .catch((e) => console.error("spec", d.slug, e.message));
    }

    for (const e of d.emulation ?? []) {
      await connection
        .execute(
          "INSERT IGNORE INTO emulation_scores (device_id, system, score) VALUES (?, ?, ?)",
          [deviceId, e.system, e.score],
        )
        .catch(() => {});
    }

    if (d.image) {
      await connection
        .execute(
          "INSERT INTO device_images (device_id, url, kind, alt, sort_order) VALUES (?, ?, 'front', ?, 0)",
          [deviceId, d.image.url, d.image.alt],
        )
        .catch(() => {});
    }
    console.log(`device: ${d.slug}`);
  }
}

async function seedGithubRepos() {
  const path = "./seed-data/github-repos.json";
  if (!existsSync(path)) return;
  for (const r of JSON.parse(readFileSync(path, "utf8"))) {
    await connection
      .execute("INSERT IGNORE INTO github_repos (owner, repo, created_at) VALUES (?, ?, NOW())", [r.owner, r.repo])
      .catch(() => {});
  }
}

async function ensureSystemAuthor() {
  const [rows] = await connection.execute("SELECT id FROM users WHERE handle='retrowiki' LIMIT 1");
  if (rows[0]) return rows[0].id;
  const hash = await bcrypt.hash("seed-" + Date.now() + "-Rw!", 12);
  const [res] = await connection.execute(
    "INSERT INTO users (email, handle, display_name, password_hash, role, email_verified_at, created_at, updated_at) VALUES ('conteudo@retrowiki.local','retrowiki','Equipe RetroWiki',?, 'admin', NOW(), NOW(), NOW())",
    [hash],
  );
  return res.insertId;
}

function blockText(body) {
  const parts = [];
  for (const b of body.blocks ?? []) {
    if (b.text) parts.push(b.text);
    if (b.items) b.items.forEach((i) => parts.push(typeof i === "string" ? i : `${i.title} ${i.text}`));
  }
  return parts.join(" ").slice(0, 8000);
}

async function seedArticles(authorId) {
  const path = "./seed-data/articles.json";
  if (!existsSync(path)) return;
  const data = JSON.parse(readFileSync(path, "utf8"));
  const [devs] = await connection.execute("SELECT id, slug FROM devices");
  const idBySlug = new Map(devs.map((d) => [d.slug, d.id]));
  let n = 0;
  for (const a of data) {
    const [rows] = await connection.execute("SELECT id FROM articles WHERE slug=? LIMIT 1", [a.slug]);
    if (rows[0]) continue;
    const [res] = await connection.execute(
      "INSERT INTO articles (slug, type, title, summary, device_id, author_id, status, search_text, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'published', ?, NOW(), NOW(), NOW())",
      [a.slug, a.type, a.title, a.summary ?? null, idBySlug.get(a.deviceSlug) ?? null, authorId, blockText(a.body)],
    );
    const articleId = res.insertId;
    const [rev] = await connection.execute(
      "INSERT INTO revisions (article_id, body, editor_id, created_at) VALUES (?, ?, ?, NOW())",
      [articleId, JSON.stringify(a.body), authorId],
    );
    await connection.execute("UPDATE articles SET current_revision_id=? WHERE id=?", [rev.insertId, articleId]);
    n++;
  }
  console.log(`articles: ${n}`);
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) return;
  const [rows] = await connection.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [
    email.toLowerCase(),
  ]);
  if (rows[0]) return;
  const hash = await bcrypt.hash(password, 12);
  const handle = slugify(email.split("@")[0]) || "admin";
  await connection.execute(
    "INSERT INTO users (email, handle, display_name, password_hash, role, email_verified_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'admin', NOW(), NOW(), NOW())",
    [email.toLowerCase(), handle, "Administrador", hash],
  );
}

try {
  console.log("Seed de categorias…");
  await seedCategories();
  console.log("Seed de devices…");
  await seedDevices();
  await seedGithubRepos();
  console.log("Seed de artigos…");
  const systemId = await ensureSystemAuthor();
  await seedArticles(systemId);
  await seedAdmin();
  console.log("Seed completo.");
} catch (err) {
  console.error("Seed failed:", err);
  process.exitCode = 1;
} finally {
  await connection.end();
}
