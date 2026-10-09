import type { NextRequest } from "next/server";

export type RateLimitDecision = { allowed: boolean; retryAfter: number; remaining: number };
const WINDOW_SECONDS = 60;
const DEFAULT_LIMIT = 90;

/**
 * Optional distributed fixed-window limiter using Upstash Redis REST.
 * Configure both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 * If not configured or Redis is unreachable, traffic is not blocked.
 */
export async function checkApiRateLimit(request: NextRequest): Promise<RateLimitDecision | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim();
  if (!ip) return null;

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  const hash = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
  const bucket = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
  const key = `formula:data:api:${hash}:${bucket}`;
  const configuredLimit = Number(process.env.FORMULA_API_RATE_LIMIT);
  const limit = Number.isInteger(configuredLimit) && configuredLimit > 0
    ? Math.min(configuredLimit, 10000)
    : DEFAULT_LIMIT;

  try {
    const response = await fetch(url.replace(/\/$/, "") + "/pipeline", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, "120", "NX"],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) return null;
    const count = Number(payload[0]?.result);
    if (!Number.isFinite(count)) return null;
    const retryAfter = WINDOW_SECONDS - Math.floor(Date.now() / 1000) % WINDOW_SECONDS;
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfter,
    };
  } catch {
    return null;
  }
}
