import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { queryOne, query } from '@/lib/db';
import { isRateLimited, rateLimitKey } from '@/lib/rateLimit';
import { sendMerchantEmailOTP } from '@/lib/mail';

export async function POST(req: NextRequest) {
  if (isRateLimited(rateLimitKey(req, 'resend-otp'), 5)) {
    return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 });
  }
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    const merchant = await queryOne<{ id: string; business_name: string; email_verified: number }>(
      'SELECT id, business_name, email_verified FROM merchants WHERE email = ?',
      [email.toLowerCase().trim()],
    );
    if (!merchant) return NextResponse.json({ error: 'No account found.' }, { status: 404 });
    if (merchant.email_verified) return NextResponse.json({ ok: true, alreadyVerified: true });

    const otp = String(randomInt(100000, 1000000));
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await query('UPDATE merchants SET email_otp=?, email_otp_expires=? WHERE id=?', [otp, expires, merchant.id]);

    sendMerchantEmailOTP(email.toLowerCase().trim(), merchant.business_name, otp)
      .catch(e => console.error('[resend-otp] failed:', e));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/merchant/auth/resend-otp]', err);
    return NextResponse.json({ error: 'Failed to resend.' }, { status: 500 });
  }
}
