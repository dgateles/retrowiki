import "server-only";

/**
 * Lightweight in-memory fixed-window rate limiter. Sufficient for a
 * single-instance deploy; swap for Redis when scaling horizontally. The map
 * lives on globalThis so it survives dev hot-reloads.
 */
type Bucket = { count: number; resetAt: number };

const globalForRl = globalThis as unknown as {
  __rwRateLimit?: Map<string, Bucket>;
};

const buckets = globalForRl.__rwRateLimit ?? new Map<string, Bucket>();
globalForRl.__rwRateLimit = buckets;

export type RateLimitResult = { ok: boolean; remaining: number; resetAt: number };

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}
