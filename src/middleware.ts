/**
 * middleware.ts — Route guards (Edge Runtime compatible)
 *
 * Strategy:
 * - API routes: check cookie PRESENCE (401 if missing)
 *   Full JWT verification happens inside each API route handler, which
 *   runs in Node.js context and has full process.env access.
 * - Admin pages: redirect to /admin/login if admin cookie absent.
 * - Merchant API whitelist: auth routes bypass the guard.
 *
 * We intentionally do NOT verify the JWT signature in middleware.
 * JWT verification is done in Node.js context (API routes + server components)
 * where process.env is fully available. Edge runtime does not reliably
 * expose runtime env vars.
 */
import { NextRequest, NextResponse } from 'next/server';
import { MERCHANT_COOKIE_NAME, ADMIN_COOKIE_NAME } from '@/lib/auth';

const MERCHANT_AUTH_WHITELIST = [
  '/api/merchant/auth/login',
  '/api/merchant/auth/logout',
  '/api/merchant/auth/forgot',
  '/api/merchant/auth/reset',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin IP allowlist ────────────────────────────────────────────
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const allowedIPs = process.env.ADMIN_ALLOWED_IPS;
    if (allowedIPs && allowedIPs.trim()) {
      const allowed = allowedIPs.split(',').map(ip => ip.trim()).filter(Boolean);
      const clientIP =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        'unknown';
      if (!allowed.includes(clientIP)) {
        return new NextResponse('Not Found', { status: 404 }); // 404 not 403 — don't reveal admin exists
      }
    }
  }

  // ── Guard: /api/merchant/* (except auth) ──────────────────────────
  if (pathname.startsWith('/api/merchant/') && !MERCHANT_AUTH_WHITELIST.includes(pathname)) {
    const hasCookie = !!req.cookies.get(MERCHANT_COOKIE_NAME)?.value;
    if (!hasCookie) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
  }

  // ── Guard: /api/admin/* (except login/logout) ─────────────────────
  if (
    pathname.startsWith('/api/admin/') &&
    pathname !== '/api/admin/auth/login' &&
    pathname !== '/api/admin/auth/logout'
  ) {
    const hasCookie = !!req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!hasCookie) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
  }

  // ── Guard: /admin/* pages (except /admin/login) ───────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const hasCookie = !!req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!hasCookie) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/merchant/:path*',
    '/api/admin/:path*',
    '/admin/:path*',
    '/admin',
  ],
};
