import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "@/lib/env";
import * as schema from "./schema";

// Single shared connection pool, reused across hot reloads in dev.
const globalForDb = globalThis as unknown as {
  __rwPool?: mysql.Pool;
};

const pool =
  globalForDb.__rwPool ??
  mysql.createPool({
    uri: env.DATABASE_URL,
    connectionLimit: 10,
    waitForConnections: true,
    timezone: "Z",
    charset: "utf8mb4", // garante acentos e emoji (4 bytes)
  });

if (env.NODE_ENV !== "production") {
  globalForDb.__rwPool = pool;
}

export const db = drizzle(pool, {
  schema,
  mode: "default",
  casing: "snake_case",
});

export { schema };
