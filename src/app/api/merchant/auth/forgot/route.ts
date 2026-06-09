import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { queryOne, query } from '@/lib/db';
import { sendMerchantResetPassword } from '@/lib/mail';

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

      await sendMerchantResetPassword(email, merchant.business_name, resetUrl, RESET_TTL_MINUTES);
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
