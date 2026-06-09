import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import {
  comparePassword,
  signToken,
  MERCHANT_COOKIE_NAME,
} from '@/lib/auth';
import { MERCHANT_SESSION_MAX_AGE } from '@/lib/constants';
import { isRateLimited, rateLimitKey } from '@/lib/rateLimit';

interface MerchantAuthRow {
  id:            string;
  slug:          string;
  business_name: string;
  password_hash: string;
  status:        string;
}

export async function POST(req: NextRequest) {
  if (isRateLimited(rateLimitKey(req, 'merch-login'))) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const merchant = await queryOne<MerchantAuthRow>(
      'SELECT id, slug, business_name, password_hash, status FROM merchants WHERE email = ?',
      [email.toLowerCase().trim()],
    );

    // Always compare to prevent timing attacks
    const dummyHash = '$2a$12$dummyhashfortimingprotectiononly.000000000000000000000000';
    const passwordMatch = await comparePassword(password, merchant?.password_hash ?? dummyHash);

    if (!merchant || !passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (merchant.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Contact support.' },
        { status: 403 },
      );
    }

    const token = signToken({ sub: merchant.id, type: 'merchant', slug: merchant.slug });

    const res = NextResponse.json({
      ok:            true,
      slug:          merchant.slug,
      business_name: merchant.business_name,
    });

    res.cookies.set({
      name:     MERCHANT_COOKIE_NAME,
      value:    token,
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   MERCHANT_SESSION_MAX_AGE,
      path:     '/',
    });

    return res;
  } catch (err) {
    console.error('[POST /api/merchant/auth/login]', err);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
