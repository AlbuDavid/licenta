interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  /** Maximum requests allowed within the window. */
  maxRequests: number;
  /** Time window in milliseconds. */
  windowMs: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

/**
 * Simple in-memory rate limiter keyed by an identifier (e.g. IP or email).
 * Returns `{ allowed: true }` or `{ allowed: false, retryAfterMs }`.
 */
export function rateLimit(
  key: string,
  options: RateLimiterOptions
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true };
  }

  if (entry.count < options.maxRequests) {
    entry.count++;
    return { allowed: true };
  }

  return { allowed: false, retryAfterMs: entry.resetAt - now };
}
