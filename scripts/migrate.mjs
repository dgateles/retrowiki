// Runtime migration runner for the production (standalone) image.
// Uses mysql2 (bundled via serverExternalPackages) + drizzle-orm's migrator.
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const connection = await mysql.createConnection({
  uri: url,
  multipleStatements: true,
});

try {
  const db = drizzle(connection);
  await migrate(db, { migrationsFolder: "./migrations" });
  console.log("Migrations applied.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await connection.end();
}
