import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiting via Upstash Redis (sliding window). Gated:
// tanpa UPSTASH_REDIS_REST_URL/TOKEN -> no-op (selalu izinkan) agar dev jalan.

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
const limiters = new Map<string, Ratelimit>();

export function isRateLimitConfigured(): boolean {
  return Boolean(URL && TOKEN);
}

type Window = `${number} s` | `${number} m` | `${number} h`;

function getLimiter(name: string, limit: number, window: Window): Ratelimit | null {
  if (!isRateLimitConfigured()) return null;
  if (!redis) redis = new Redis({ url: URL!, token: TOKEN! });
  const cacheKey = `${name}:${limit}:${window}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `rl:${name}`,
      analytics: false,
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

// true = boleh lanjut; false = melebihi batas. No-op (true) bila belum dikonfigurasi
// atau bila Redis error (jangan sampai memblokir layanan karena gangguan infra).
export async function rateLimit(
  name: string,
  identifier: string,
  limit: number,
  window: Window
): Promise<boolean> {
  const limiter = getLimiter(name, limit, window);
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit(identifier);
    return success;
  } catch {
    return true;
  }
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
}
