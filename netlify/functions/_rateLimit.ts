/**
 * Simple in-memory rate limiter for Netlify Functions
 * TMC Studio — Security: brute-force protection
 * 
 * IMPORTANT: This is an in-memory limiter, NOT distributed.
 * Each Netlify function instance has its own counter.
 * Acceptable for MVP — upgrade to Redis-based for production scale.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

export interface RateLimitOptions {
  /** Max requests allowed within the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  maxRequests: 10,
  windowMs: 60_000, // 1 minute
};

/**
 * Check if an IP is rate-limited.
 * Returns `{ allowed: true }` or `{ allowed: false, retryAfter: number }`.
 */
export function checkRateLimit(
  ip: string,
  options: Partial<RateLimitOptions> = {}
): { allowed: true } | { allowed: false; retryAfter: number } {
  cleanup();

  const { maxRequests, windowMs } = { ...DEFAULT_OPTIONS, ...options };
  const now = Date.now();
  const entry = store.get(ip);

  // First request or window expired — reset counter
  if (!entry || now >= entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  // Window still active — increment
  entry.count += 1;

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}