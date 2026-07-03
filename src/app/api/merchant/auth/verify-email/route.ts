import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { queryOne, query } from '@/lib/db';
import { isRateLimited, rateLimitKey } from '@/lib/rateLimit';
import { sendMerchantWelcome, sendNewMerchantAlert } from '@/lib/mail';

interface MerchantOTPRow {
  id: string;
  slug: string;
  business_name: string;
  email: string;
  email_otp: string | null;
  email_otp_expires: string | null;
  email_verified: number;
}

export async function POST(req: NextRequest) {
  if (isRateLimited(rateLimitKey(req, 'verify-email'), 10)) {
    return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 });
  }
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) return NextResponse.json({ error: 'Email and OTP are required.' }, { status: 400 });

    const merchant = await queryOne<MerchantOTPRow>(
      'SELECT id, slug, business_name, email, email_otp, email_otp_expires, email_verified FROM merchants WHERE email = ?',
      [email.toLowerCase().trim()],
    );
    if (!merchant) return NextResponse.json({ error: 'Invalid code.' }, { status: 400 });
    if (merchant.email_verified) return NextResponse.json({ ok: true, alreadyVerified: true });
    const submittedOtp = String(otp).trim();
    const storedOtp = merchant.email_otp ?? '';
    const otpMatch = storedOtp.length === submittedOtp.length &&
      timingSafeEqual(Buffer.from(storedOtp), Buffer.from(submittedOtp));
    if (!merchant.email_otp || !otpMatch)
      return NextResponse.json({ error: 'Invalid code.' }, { status: 400 });
    if (!merchant.email_otp_expires || new Date(merchant.email_otp_expires) < new Date())
      return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 });

    await query(
      'UPDATE merchants SET email_verified=1, email_otp=NULL, email_otp_expires=NULL, status=? WHERE id=?',
      ['active', merchant.id],
    );

    sendMerchantWelcome(merchant.email, merchant.business_name, merchant.email, merchant.slug)
      .catch(e => console.error('[verify-email] welcome email failed:', e));
    sendNewMerchantAlert(merchant.email, merchant.business_name, merchant.slug)
      .catch(e => console.error('[verify-email] alert email failed:', e));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/merchant/auth/verify-email]', err);
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
  }
}
