// src/lib/customerAuth.ts
// Customer JWT helpers — Bearer token in Authorization header.
// Uses CUSTOMER_JWT_SECRET, separate from the merchant/admin JWT_SECRET.
// SECURITY NOTE: token is stored in localStorage on the client (XSS risk).
// Pre-production TODO: migrate to httpOnly cookie to eliminate XSS exposure.

import jwt from 'jsonwebtoken';

const SECRET = (() => {
  // Must use a DIFFERENT secret from JWT_SECRET so a compromised customer token
  // cannot be replayed against merchant/admin routes.
  const s = process.env.CUSTOMER_JWT_SECRET;
  if (!s && process.env.NODE_ENV === 'production') {
    throw new Error('CUSTOMER_JWT_SECRET env var is required in production');
  }
  return s || 'dev_cust_secret_change_in_production';
})();

const EXPIRY = '30d';
export const TOKEN_KEY = 'll_customer_token'; // localStorage key

export interface CustomerTokenPayload {
  sub:   string;  // customer id
  type:  'customer';
  phone: string;  // E.164 e.g. +91XXXXXXXXXX
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

export function getCustomerFromRequest(req: Request): CustomerTokenPayload | null {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  return verifyCustomerToken(token);
}

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
