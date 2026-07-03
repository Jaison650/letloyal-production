import { NextRequest, NextResponse } from 'next/server';
import { comparePassword } from '@/lib/auth';
import { signCustomerToken, CUSTOMER_SESSION_MAX_AGE } from '@/lib/customerAuth';
import { CUSTOMER_COOKIE_NAME } from '@/lib/authConstants';
import { queryOne } from '@/lib/db';
import { normalizePhone } from '@/lib/utils';
import { isRateLimited, rateLimitKey } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  if (isRateLimited(rateLimitKey(req, 'cust-login'))) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }
  try {
    const { phone_number, password } = await req.json();

    if (!phone_number) return NextResponse.json({ error: 'Phone is required.' }, { status: 400 });
    if (!password)     return NextResponse.json({ error: 'Password is required.' }, { status: 400 });

    const normPhone = normalizePhone(phone_number);
    if (!normPhone) return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });

    const customer = await queryOne<{
      id: string; name: string | null; email: string | null;
      password_hash: string | null; birthday: string | null; gender: string | null;
    }>(
      'SELECT id, name, email, password_hash, birthday, gender FROM customers WHERE phone_number = ?',
      [normPhone]
    );

    if (!customer) {
      return NextResponse.json({ error: 'No account found with this phone number.' }, { status: 401 });
    }

    // ── Existing phone-only account (no password set yet) ─────────────
    if (!customer.password_hash) {
      return NextResponse.json({
        error: 'PASSWORD_NOT_SET',
        message: 'This account was created by scanning a QR code. Please set a password to continue.',
      }, { status: 401 });
    }

    const valid = await comparePassword(password, customer.password_hash);
    if (!valid) return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });

    const token  = signCustomerToken({ sub: customer.id, phone: normPhone });
    const digits = normPhone.replace('+91', '');

    const res = NextResponse.json({
      ok: true,
      customer: {
        id:       customer.id,
        name:     customer.name,
        phone:    digits,
        email:    customer.email,
        birthday: customer.birthday,
        gender:   customer.gender,
      },
    });
    res.cookies.set({
      name:     CUSTOMER_COOKIE_NAME,
      value:    token,
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   CUSTOMER_SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error('[POST /api/customer/auth/login]', err);
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}
