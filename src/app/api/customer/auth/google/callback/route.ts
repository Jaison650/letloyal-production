import { NextRequest, NextResponse } from 'next/server';
import { signCustomerToken, CUSTOMER_SESSION_MAX_AGE } from '@/lib/customerAuth';
import { CUSTOMER_COOKIE_NAME } from '@/lib/authConstants';
import { queryOne, query } from '@/lib/db';

interface GoogleTokenResponse {
  access_token: string;
  id_token:     string;
  error?:       string;
}

interface GoogleUserInfo {
  sub:   string;
  email: string;
  name:  string;
}

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');
  const base  = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(new URL('/my-rewards?auth_error=google_cancelled', base));
  }

  try {
    const redirectUri = `${base}/api/customer/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }),
    });
    const tokenData: GoogleTokenResponse = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      console.error('[google/callback] token exchange failed:', tokenData);
      return NextResponse.redirect(new URL('/my-rewards?auth_error=google_failed', base));
    }

    // Fetch user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/my-rewards?auth_error=google_failed', base));
    }
    const user: GoogleUserInfo = await userRes.json();
    if (!user.sub || !user.email) {
      return NextResponse.redirect(new URL('/my-rewards?auth_error=google_failed', base));
    }

    // Find or create customer
    let customer = await queryOne<{ id: string; phone_number: string | null }>(
      'SELECT id, phone_number FROM customers WHERE google_id = ? OR (email = ? AND email IS NOT NULL) LIMIT 1',
      [user.sub, user.email]
    );

    if (!customer) {
      // Create new customer
      await query(
        'INSERT INTO customers (google_id, email, name, phone_number) VALUES (?, ?, ?, NULL)',
        [user.sub, user.email, user.name]
      );
      customer = await queryOne<{ id: string; phone_number: string | null }>(
        'SELECT id, phone_number FROM customers WHERE google_id = ?',
        [user.sub]
      );
    } else {
      // Link google_id if not already linked (e.g. registered via phone first)
      await query(
        'UPDATE customers SET google_id = ? WHERE id = ? AND google_id IS NULL',
        [user.sub, customer.id]
      );
    }

    if (!customer) {
      return NextResponse.redirect(new URL('/my-rewards?auth_error=google_failed', base));
    }

    const token = signCustomerToken({ sub: customer.id, phone: customer.phone_number });
    const res   = NextResponse.redirect(new URL('/my-rewards', base));
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
    console.error('[google/callback]', err);
    return NextResponse.redirect(new URL('/my-rewards?auth_error=google_failed', base));
  }
}
