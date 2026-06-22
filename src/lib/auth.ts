/**
 * auth.ts — JWT + cookie helpers (Node.js runtime).
 * Pulls in jsonwebtoken + bcryptjs, so this file MUST NOT be imported by
 * middleware (Edge runtime). Middleware imports cookie names from
 * @/lib/authConstants instead. For DB-backed session helpers see @/lib/session.ts.
 */
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
// bcryptjs is Node.js-only — imported in @/lib/password.ts, NOT here (Edge-safe)

const JWT_SECRET = (() => {
  const s = process.env.JWT_SECRET;
  if (!s && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET env var is required in production');
  return s || 'dev_secret_change_in_production';
})();
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

// Cookie names live in @/lib/authConstants (Edge-safe, no Node deps).
// Imported for use below and re-exported so existing import sites keep working.
import { MERCHANT_COOKIE_NAME, ADMIN_COOKIE_NAME } from '@/lib/authConstants';
export { MERCHANT_COOKIE_NAME, ADMIN_COOKIE_NAME };

// ── Token payload shapes ──────────────────────────────────────────────
export interface MerchantPayload {
  sub:  string;
  type: 'merchant';
  slug: string;
}

export interface AdminPayload {
  sub:   string;
  type:  'admin';
  email: string;
  role:  'superadmin' | 'staff';
  name:  string;
}

export type TokenPayload = MerchantPayload | AdminPayload;

// ── DB row shape (shared type, no DB import needed here) ──────────────
export interface MerchantRow {
  id:                string;
  slug:              string;
  business_name:     string;
  logo_url:          string | null;
  banner_url:        string | null;
  address:           string | null;
  gmaps_url:         string | null;
  instagram_url:     string | null;
  google_review_url: string | null;
  created_at:        string;
}

// ── JWT helpers ───────────────────────────────────────────────────────
export function signToken(payload: MerchantPayload, expiresIn: string = JWT_EXPIRY): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function signAdminToken(payload: Omit<AdminPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Password helpers live in @/lib/password.ts (Node.js only, bcryptjs).
// Re-export here for backward compat so existing import sites don't break.
export { hashPassword, comparePassword } from '@/lib/password';

// ── Cookie helpers ────────────────────────────────────────────────────
export function cookieOptions(cookieName: string, maxAge: number) {
  return {
    name:     cookieName,
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path:     '/',
  };
}

// ── Cookie-based auth readers (no DB) ────────────────────────────────
export async function getMerchantAuthFromCookies(): Promise<MerchantPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(MERCHANT_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.type !== 'merchant') return null;
  return payload;
}

export function getMerchantAuthFromRequest(req: NextRequest): MerchantPayload | null {
  const token = req.cookies.get(MERCHANT_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.type !== 'merchant') return null;
  return payload;
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.type !== 'admin') return null;
  return payload;
}

export function getAdminSessionFromRequest(req: NextRequest): AdminPayload | null {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.type !== 'admin') return null;
  return payload;
}

// ── Type guards ───────────────────────────────────────────────────────
export function isMerchant(p: TokenPayload): p is MerchantPayload {
  return p.type === 'merchant';
}

export function isAdmin(p: TokenPayload): p is AdminPayload {
  return p.type === 'admin';
}

// ── Admin guard (API route helper) ───────────────────────────────────
// Use at the top of every /api/admin/* handler (except login/logout).
// Runs in Node.js context — full JWT verification with real JWT_SECRET.
export function requireAdmin(req: NextRequest): AdminPayload {
  const payload = getAdminSessionFromRequest(req);
  if (!payload) {
    throw new Response(JSON.stringify({ error: 'Not authenticated.' }), {
      status:  401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return payload;
}

// ── Cross-tenant guard (API route helper) ─────────────────────────────
// Use on every /api/merchant/[slug]/* route.
// Returns MerchantPayload if logged-in merchant owns this slug.
// Throws a Response (401/403) otherwise — caller must return it.
export function requireMerchant(req: NextRequest, slug: string): MerchantPayload {
  const payload = getMerchantAuthFromRequest(req);
  if (!payload) {
    throw new Response(JSON.stringify({ error: 'Not authenticated.' }), {
      status:  401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (payload.slug !== slug) {
    throw new Response(JSON.stringify({ error: 'Access denied.' }), {
      status:  403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return payload;
}
