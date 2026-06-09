// src/lib/customerAuth.ts
// Customer JWT helpers — Bearer token stored in localStorage (not cookies).
// Uses a separate secret from the merchant JWT.

import jwt from 'jsonwebtoken';

const SECRET = (() => {
  const s = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET;
  if (!s && process.env.NODE_ENV === 'production') throw new Error('CUSTOMER_JWT_SECRET or JWT_SECRET env var is required in production');
  return s || 'dev_cust_secret';
})();
const EXPIRY  = '7d';
export const TOKEN_KEY = 'll_customer_token'; // localStorage key

export interface CustomerTokenPayload {
  sub:   string;  // customer id
  type:  'customer';
  phone: string;  // +91XXXXXXXXXX
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

/**
 * Extract and verify Bearer token from Authorization header.
 * Returns payload or null.
 */
export function getCustomerFromRequest(req: Request): CustomerTokenPayload | null {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  return verifyCustomerToken(token);
}

/**
 * Guard for customer-authenticated API routes.
 * Throws a Response(401) if not authenticated.
 */
export function requireCustomer(req: Request): CustomerTokenPayload {
  const payload = getCustomerFromRequest(req);
  if (!payload) {
    throw new Response(JSON.stringify({ error: 'Not authenticated.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return payload;
}
