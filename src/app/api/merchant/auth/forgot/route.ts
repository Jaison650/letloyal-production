import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { queryOne, query } from '@/lib/db';
import { sendMail } from '@/lib/mail';

const RESET_TTL_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // Always return 200 — don't leak which emails exist
    const merchant = await queryOne<{ id: string; business_name: string }>(
      'SELECT id, business_name FROM merchants WHERE email = ? AND status = ?',
      [email.toLowerCase().trim(), 'active'],
    );

    if (merchant) {
      // Generate a secure random token
      const rawToken  = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

      // Invalidate any existing unused tokens for this merchant
      await query(
        'UPDATE reset_tokens SET used_at = NOW() WHERE merchant_id = ? AND used_at IS NULL',
        [merchant.id],
      );

      // Insert new token
      await query(
        `INSERT INTO reset_tokens (id, merchant_id, token_hash, expires_at)
         VALUES (UUID(), ?, ?, ?)`,
        [merchant.id, tokenHash, expiresAt],
      );

      const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/merchant/reset?token=${rawToken}`;

      await sendMail({
        to:      email,
        subject: 'Reset your LetLoyal password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
            <h2 style="color:#0d9488;margin-bottom:8px">Reset your password</h2>
            <p style="color:#374151">Hi ${merchant.business_name},</p>
            <p style="color:#374151">Click the button below to reset your LetLoyal merchant password.
               This link expires in ${RESET_TTL_MINUTES} minutes.</p>
            <a href="${resetUrl}"
               style="display:inline-block;margin:24px 0;padding:12px 28px;background:#0d9488;color:#fff;border-radius:9999px;text-decoration:none;font-weight:700">
              Reset Password
            </a>
            <p style="color:#6b7280;font-size:13px">
              If you didn't request this, you can safely ignore this email.<br>
              Link: ${resetUrl}
            </p>
          </div>
        `,
      });
    }

    // Always return the same response
    return NextResponse.json({
      ok:      true,
      message: "If that email exists, we've sent a reset link.",
    });
  } catch (err) {
    console.error('[POST /api/merchant/auth/forgot]', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
