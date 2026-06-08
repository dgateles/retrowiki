# syntax=docker/dockerfile:1

# ----- deps: install all dependencies -----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ----- builder: produce the standalone Next.js bundle -----
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Placeholder env so env validation passes during static generation. DB queries
# are guarded and degrade gracefully, so no real database is needed at build.
ENV NODE_ENV=production
ENV DATABASE_URL="mysql://build:build@127.0.0.1:3306/build"
ENV AUTH_SECRET="build-time-placeholder-secret-change-me"
ENV CAPTCHA_SECRET="build-time-placeholder-secret-change-me"
RUN npm run build

# ----- runner: minimal runtime image -----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# Non-root runtime user.
RUN groupadd -r app && useradd -r -g app -d /app app

# Standalone server + assets.
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

# Migrations + runtime migration/seed runners. drizzle-orm is bundled into the
# server chunks; add it back for the standalone migrate step (mysql2 is present
# via serverExternalPackages tracing).
COPY --from=builder --chown=app:app /app/src/db/migrations ./migrations
COPY --from=deps --chown=app:app /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --chown=app:app scripts/migrate.mjs ./migrate.mjs
COPY --chown=app:app scripts/seed.mjs ./seed.mjs
COPY --chown=app:app docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Persistent storage for uploaded/processed files. Mounted as a volume.
RUN mkdir -p /app/storage && chown -R app:app /app/storage
ENV STORAGE_DIR=/app/storage

USER app
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --retries=10 \
  CMD curl -fsS http://localhost:3000/api/health || exit 1

CMD ["./docker-entrypoint.sh"]
