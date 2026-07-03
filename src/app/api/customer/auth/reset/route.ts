// src/app/api/customer/auth/reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { signCustomerToken, CUSTOMER_SESSION_MAX_AGE } from '@/lib/customerAuth';
import { CUSTOMER_COOKIE_NAME } from '@/lib/authConstants';
import { queryOne, query } from '@/lib/db';
import { isRateLimited, rateLimitKey } from '@/lib/rateLimit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  if (isRateLimited(rateLimitKey(req, 'cust-reset'), 5)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }
  try {
    const { token, password } = await req.json();
    if (!token)    return NextResponse.json({ error: 'Token is required.' },    { status: 400 });
    if (!password) return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const record = await queryOne<{ id: string; customer_id: string; expires_at: string; used_at: string | null }>(
      `SELECT id, customer_id, expires_at, used_at
       FROM customer_reset_tokens
       WHERE token_hash = ?`,
      [tokenHash]
    );

    if (!record)          return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
    if (record.used_at)   return NextResponse.json({ error: 'This reset link has already been used.' }, { status: 400 });
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const password_hash = await hashPassword(password);

    // Mark token used + update password
    await query('UPDATE customer_reset_tokens SET used_at = NOW() WHERE id = ?', [record.id]);
    await query('UPDATE customers SET password_hash = ? WHERE id = ?', [password_hash, record.customer_id]);

    // Auto-login: issue new token
    const customer = await queryOne<{ id: string; name: string | null; phone_number: string; email: string | null }>(
      'SELECT id, name, phone_number, email FROM customers WHERE id = ?',
      [record.customer_id]
    );
    if (!customer) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

    const jwtToken = signCustomerToken({ sub: customer.id, phone: customer.phone_number });
    const digits   = customer.phone_number.replace('+91', '');

    const res = NextResponse.json({
      ok: true,
      customer: { id: customer.id, name: customer.name, phone: digits, email: customer.email },
    });
    res.cookies.set({
      name:     CUSTOMER_COOKIE_NAME,
      value:    jwtToken,
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   CUSTOMER_SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error('[POST /api/customer/auth/reset]', err);
    return NextResponse.json({ error: 'Password reset failed.' }, { status: 500 });
  }
}
