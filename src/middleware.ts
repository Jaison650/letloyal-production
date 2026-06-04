import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromRequest, getAdminSessionFromRequest } from '@/lib/auth';

const MERCHANT_AUTH_WHITELIST = [
  '/api/merchant/auth/login',
  '/api/merchant/auth/logout',
  '/api/merchant/auth/forgot',
  '/api/merchant/auth/reset',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Guard: /api/merchant/* (except auth) ──────────────────────────
  if (pathname.startsWith('/api/merchant/') && !MERCHANT_AUTH_WHITELIST.includes(pathname)) {
    const auth = getMerchantAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
  }

  // ── Guard: /api/admin/* (except login/logout) ─────────────────────
  if (
    pathname.startsWith('/api/admin/') &&
    pathname !== '/api/admin/auth/login' &&
    pathname !== '/api/admin/auth/logout'
  ) {
    const admin = getAdminSessionFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
  }

  // ── Guard: /admin/* pages (except /admin/login) ───────────────────
  // Redirects unauthenticated browser requests to /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const admin = getAdminSessionFromRequest(req);
    if (!admin) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
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
