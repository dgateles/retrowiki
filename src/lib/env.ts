import "server-only";
import { z } from "zod";

/**
 * Centralised, validated environment configuration. Importing on the client
 * throws (via `server-only`); secrets stay on the server. Validation runs once
 * at module load so a misconfigured deploy fails fast.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 chars"),
  CAPTCHA_SECRET: z.string().min(16, "CAPTCHA_SECRET must be at least 16 chars"),
  STORAGE_DIR: z.string().default("./storage"),
  GITHUB_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("RetroWiki <noreply@localhost>"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  SEED_ADMIN_EMAIL: z.email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment configuration:\n${issues}\n` +
      `Check your .env file against .env.example.`,
  );
}

export const env = parsed.data;
export type Env = typeof env;
