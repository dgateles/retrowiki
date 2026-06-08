import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

// Standalone migration runner (npm run db:migrate). Applies every SQL file in
// src/db/migrations against DATABASE_URL, then exits.
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required.");

  const connection = await mysql.createConnection({
    uri: url,
    multipleStatements: true,
  });
  const db = drizzle(connection);

  console.log("Running migrations…");
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("Migrations complete.");

  await connection.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
