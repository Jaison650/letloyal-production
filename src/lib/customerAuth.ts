// src/lib/customerAuth.ts
// Customer JWT helpers — httpOnly cookie (migrated from Bearer/localStorage).
// Uses CUSTOMER_JWT_SECRET, separate from merchant/admin JWT_SECRET.

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { CUSTOMER_COOKIE_NAME } from '@/lib/authConstants';

const SECRET = (() => {
  const s = process.env.CUSTOMER_JWT_SECRET;
  if (!s && process.env.NODE_ENV === 'production') {
    throw new Error('CUSTOMER_JWT_SECRET env var is required in production');
  }
  return s || 'dev_cust_secret_change_in_production';
})();

const EXPIRY = '30d';
export const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export interface CustomerTokenPayload {
  sub:   string;       // customer id
  type:  'customer';
  phone: string | null; // E.164 e.g. +91XXXXXXXXXX
}

export function signCustomerToken(payload: Omit<CustomerTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'customer' }, SECRET, { expiresIn: EXPIRY } as jwt.SignOptions);
}

export function verifyCustomerToken(token: string): CustomerTokenPayload | null {
  try {
    const p = jwt.verify(token, SECRET) as CustomerTokenPayload;
    if (p.type !== 'customer') return null;
    return p;
  } catch {
    return null;
  }
}

// Server component / route handler (reads from Next.js cookie store)
export async function getCustomerSession(): Promise<CustomerTokenPayload | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

// Middleware / API route handler (reads from NextRequest)
export function getCustomerFromRequest(req: NextRequest): CustomerTokenPayload | null {
  const token = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

// Used in route handlers that still receive a plain Request (e.g. account/route.ts)
// Falls back to reading from NextRequest cookies if available.
export function requireCustomer(req: Request): CustomerTokenPayload {
  // Try cookie from NextRequest (cast — NextRequest extends Request)
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${CUSTOMER_COOKIE_NAME}=([^;]+)`));
  const token = match?.[1] ?? null;
  const payload = token ? verifyCustomerToken(token) : null;
  if (!payload) {
    throw new Response(JSON.stringify({ error: 'Not authenticated.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return payload;
}

export async function requireCustomerSession(): Promise<CustomerTokenPayload> {
  const payload = await getCustomerSession();
  if (!payload) {
    throw new Response(JSON.stringify({ error: 'Not authenticated.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return payload;
}
