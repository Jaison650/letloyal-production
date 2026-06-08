// src/app/api/customer/auth/forgot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { sendMail } from '@/lib/mail';
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
      const name     = customer.name?.split(' ')[0] ?? 'there';

      await sendMail({
        to:      normEmail,
        subject: 'Reset your LetLoyal password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="color:#0d9488;">Reset your password</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your LetLoyal account password.</p>
            <a href="${resetUrl}"
               style="display:inline-block;background:#0d9488;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0;">
              Reset Password
            </a>
            <p style="color:#6b7280;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true, message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (err) {
    console.error('[POST /api/customer/auth/forgot]', err);
    return NextResponse.json({ error: 'Failed to send reset email.' }, { status: 500 });
  }
}
