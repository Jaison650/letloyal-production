import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const base     = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const redirectUri = `${base}/api/customer/auth/google/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth not configured.' }, { status: 503 });
  }

  const state = randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'openid email profile',
    prompt:        'select_account',
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  const response = NextResponse.redirect(authUrl);
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   600, // 10 minutes
  });
  return response;
}
