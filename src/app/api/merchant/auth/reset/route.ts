import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { withTransaction } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  try {
    const { token, new_password } = await req.json();

    if (!token || !new_password) {
      return NextResponse.json({ error: 'Token and new password are required.' }, { status: 400 });
    }

    if (new_password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 },
      );
    }

    const tokenHash   = crypto.createHash('sha256').update(String(token)).digest('hex');
    const passwordHash = await hashPassword(new_password);

    // Atomic: look up token, verify, mark used, and update password in one transaction.
    // This closes the TOCTOU window between lookup and update.
    const result = await withTransaction(async (client) => {
      const rows = await client.query(
        `SELECT id, merchant_id, expires_at, used_at
           FROM reset_tokens
          WHERE token_hash = ?
          LIMIT 1`,
        [tokenHash],
      );
      const resetToken = rows.rows[0];

      if (!resetToken) return { error: 'Invalid or expired reset link.', status: 400 };
      if (resetToken.used_at) return { error: 'This reset link has already been used.', status: 400 };
      if (new Date() > new Date(resetToken.expires_at as string)) {
        return { error: 'This reset link has expired. Please request a new one.', status: 400 };
      }

      // Mark token used FIRST — prevents replay if the password update fails
      await client.query(
        'UPDATE reset_tokens SET used_at = NOW() WHERE id = ?',
        [resetToken.id],
      );

      await client.query(
        'UPDATE merchants SET password_hash = ? WHERE id = ?',
        [passwordHash, resetToken.merchant_id],
      );

      return { ok: true };
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status as number });
    }

    return NextResponse.json({ ok: true, message: 'Password updated. You can now log in.' });
  } catch (err) {
    console.error('[POST /api/merchant/auth/reset]', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
