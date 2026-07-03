/**
 * middleware.ts — Route guards (Edge Runtime compatible)
 *
 * Strategy:
 * - API routes: check cookie PRESENCE (401 if missing)
 *   Full JWT verification happens inside each API route handler, which
 *   runs in Node.js context and has full process.env access.
 * - Admin pages: redirect to /admin/login if admin cookie absent.
 * - Merchant API whitelist: auth routes bypass the guard.
 * - Customer API whitelist: auth routes bypass the guard.
 *
 * We intentionally do NOT verify the JWT signature in middleware.
 * JWT verification is done in Node.js context (API routes + server components)
 * where process.env is fully available. Edge runtime does not reliably
 * expose runtime env vars.
 */
import { NextRequest, NextResponse } from 'next/server';
// Import from authConstants (Edge-safe) — NOT @/lib/auth, which pulls
// jsonwebtoken + bcryptjs into the Edge bundle.
import { MERCHANT_COOKIE_NAME, ADMIN_COOKIE_NAME, CUSTOMER_COOKIE_NAME } from '@/lib/authConstants';

const MERCHANT_AUTH_WHITELIST = [
  '/api/merchant/auth/register',
  '/api/merchant/auth/login',
  '/api/merchant/auth/logout',
  '/api/merchant/auth/forgot',
  '/api/merchant/auth/reset',
  '/api/merchant/auth/verify-email',
  '/api/merchant/auth/resend-otp',
];

const CUSTOMER_AUTH_WHITELIST = [
  '/api/customer/auth/login',
  '/api/customer/auth/register',
  '/api/customer/auth/logout',
  '/api/customer/auth/forgot',
  '/api/customer/auth/reset',
  '/api/customer/auth/google',
  '/api/customer/auth/google/callback',
  '/api/customer/auth/me',
  '/api/customer/lookup',
  '/api/customer/nearby',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Guard: /api/customer/* (except auth whitelist) ────────────────
  if (
    pathname.startsWith('/api/customer/') &&
    !CUSTOMER_AUTH_WHITELIST.some(w => pathname === w || pathname.startsWith(w + '/'))
  ) {
    const hasCookie = !!req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!hasCookie) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/merchant/:path*',
    '/api/admin/:path*',
    '/api/customer/:path*',
    '/admin/:path*',
    '/admin',
  ],
};
