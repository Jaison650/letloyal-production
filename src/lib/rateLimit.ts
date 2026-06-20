// In-memory rate limiter — sufficient for single-process Vercel deployments.
// LIMITATION: resets on cold start and does not share state across instances.
// For multi-instance scale, replace with Redis (e.g. Upstash) using the same interface.

const store = new Map<string, { count: number; resetAt: number }>();

interface RateLimitResult {
  limited:    boolean;
  retryAfter: number; // seconds until window resets (0 if not limited)
}

export function checkRateLimit(
  key:        string,
  maxRequests = 5,
  windowMs    = 15 * 60 * 1000,
): RateLimitResult {
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfter: 0 };
  }

  if (entry.count >= maxRequests) {
    return { limited: true, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { limited: false, retryAfter: 0 };
}

// Convenience wrapper — returns true if limited (backward-compat for simple callers).
export function isRateLimited(
  key:        string,
  maxRequests = 5,
  windowMs    = 15 * 60 * 1000,
): boolean {
  return checkRateLimit(key, maxRequests, windowMs).limited;
}

export function rateLimitKey(req: Request, prefix: string): string {
  const ip =
    (req.headers as Headers).get('x-forwarded-for')?.split(',')[0]?.trim() ||
    (req.headers as Headers).get('x-real-ip') ||
    'unknown';
  return `${prefix}:${ip}`;
}

// Build a 429 body + headers object — caller constructs the NextResponse.
// Usage: return NextResponse.json(...rateLimitBody(rl.retryAfter))
export function rateLimitBody(retryAfterSeconds: number): [
  { error: string },
  { status: number; headers: Record<string, string> },
] {
  return [
    { error: 'Too many attempts. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds || 60) } },
  ];
}
