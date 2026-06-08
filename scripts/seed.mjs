// Seed idempotente para a imagem de produção: categorias base + admin opcional.
// Usa SQL cru para não depender de TS/schema compilado.
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required to seed.");
  process.exit(1);
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Categorias de curadoria (Staff Pick etc.) e taxonomia inicial.
const CATEGORIES = [
  { slug: "staff-pick", label: "Staff Pick", kind: "rating" },
  { slug: "android", label: "Android", kind: "os" },
  { slug: "linux", label: "Linux", kind: "os" },
  { slug: "powerfull", label: "Potente", kind: "power" },
  { slug: "budget", label: "Custo-benefício", kind: "power" },
  { slug: "vertical", label: "Vertical", kind: "form" },
  { slug: "horizontal", label: "Horizontal", kind: "form" },
];

const connection = await mysql.createConnection({ uri: url });

async function seedCategories() {
  let order = 0;
  for (const c of CATEGORIES) {
    await connection
      .execute(
        "INSERT IGNORE INTO categories (slug, label, kind, sort_order, created_at) VALUES (?, ?, ?, ?, NOW())",
        [c.slug, c.label, c.kind, order++],
      )
      .catch(() => {});
  }
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) return;
  const [rows] = await connection.execute(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email.toLowerCase()],
  );
  if (rows[0]) return;
  console.log(`Criando admin ${email}…`);
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
  await seedAdmin();
  console.log("Seed completo.");
} catch (err) {
  console.error("Seed failed:", err);
  process.exitCode = 1;
} finally {
  await connection.end();
}
