import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { queryOne, query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

interface ResetTokenRow {
  id:          string;
  merchant_id: string;
  expires_at:  Date;
  used_at:     Date | null;
}

export async function POST(req: NextRequest) {
  try {
    const { token, new_password } = await req.json();

    if (!token || !new_password) {
      return NextResponse.json({ error: 'Token and new password are required.' }, { status: 400 });
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 },
      );
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await queryOne<ResetTokenRow>(
      'SELECT id, merchant_id, expires_at, used_at FROM reset_tokens WHERE token_hash = ?',
      [tokenHash],
    );

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
    }

    if (resetToken.used_at) {
      return NextResponse.json(
        { error: 'This reset link has already been used.' },
        { status: 400 },
      );
    }

    if (new Date() > new Date(resetToken.expires_at)) {
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(new_password);

    // Update password and mark token used in one go
    await query('UPDATE merchants SET password_hash = ? WHERE id = ?', [
      passwordHash,
      resetToken.merchant_id,
    ]);
    await query('UPDATE reset_tokens SET used_at = NOW() WHERE id = ?', [resetToken.id]);

    return NextResponse.json({ ok: true, message: 'Password updated. You can now log in.' });
  } catch (err) {
    console.error('[POST /api/merchant/auth/reset]', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
