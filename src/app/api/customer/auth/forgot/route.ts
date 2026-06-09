// src/app/api/customer/auth/forgot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { sendCustomerResetPassword } from '@/lib/mail';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    const normEmail = email.trim().toLowerCase();

    // Always respond with success to prevent email enumeration
    const customer = await queryOne<{ id: string; name: string | null }>(
      'SELECT id, name FROM customers WHERE email = ?', [normEmail]
    );

    if (customer) {
      // Generate raw token (32 bytes) → hash for DB storage
      const rawToken   = crypto.randomBytes(32).toString('hex');
      const tokenHash  = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt  = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Invalidate existing tokens for this customer
      await query(
        'DELETE FROM customer_reset_tokens WHERE customer_id = ?',
        [customer.id]
      );
      await query(
        `INSERT INTO customer_reset_tokens (customer_id, token_hash, expires_at)
         VALUES (?, ?, ?)`,
        [customer.id, tokenHash, expiresAt]
      );

      const base     = process.env.NEXT_PUBLIC_BASE_URL || 'https://pilot.letloyal.com';
      const resetUrl = `${base}/customer/reset-password?token=${rawToken}`;
      const name     = customer.name ?? 'there';

      await sendCustomerResetPassword(normEmail, name, resetUrl);
    }

    return NextResponse.json({ ok: true, message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (err) {
    console.error('[POST /api/customer/auth/forgot]', err);
    return NextResponse.json({ error: 'Failed to send reset email.' }, { status: 500 });
  }
}
