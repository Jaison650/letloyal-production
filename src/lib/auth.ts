/**
 * auth.ts — Edge-compatible JWT + cookie helpers.
 * NO database imports here — this file runs in middleware (Edge runtime).
 * For DB-backed session helpers, use @/lib/session.ts instead.
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export const MERCHANT_COOKIE_NAME = 'letloyal_merchant_session';
export const ADMIN_COOKIE_NAME    = 'letloyal_admin_session';

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

// ── Password helpers ──────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

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
