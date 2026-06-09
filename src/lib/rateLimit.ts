const store = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(
  key: string,
  maxRequests = 5,
  windowMs = 15 * 60 * 1000,
): boolean {
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= maxRequests) return true;
  entry.count++;
  return false;
}

export function rateLimitKey(req: Request, prefix: string): string {
  const ip =
    (req.headers as Headers).get('x-forwarded-for')?.split(',')[0]?.trim() ||
    (req.headers as Headers).get('x-real-ip') ||
    'unknown';
  return `${prefix}:${ip}`;
}
