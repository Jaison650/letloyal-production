import { NextResponse } from 'next/server';
import { CUSTOMER_COOKIE_NAME } from '@/lib/authConstants';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name:     CUSTOMER_COOKIE_NAME,
    value:    '',
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   0,
    expires:  new Date(0),
  });
  return res;
}
