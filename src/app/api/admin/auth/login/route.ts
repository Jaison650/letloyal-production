import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { comparePassword, signAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { ADMIN_SESSION_MAX_AGE } from '@/lib/constants';
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit';

interface AdminRow {
  id:            string;
  email:         string;
  password_hash: string;
  name:          string;
  role:          'superadmin' | 'staff';
}

export async function POST(req: NextRequest) {
  // Tighter limit for admin: 5 attempts per 30 minutes
  const rl = checkRateLimit(rateLimitKey(req, 'admin-login'), 5, 30 * 60 * 1000);
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const admin = await queryOne<AdminRow>(
      'SELECT id, email, password_hash, name, role FROM admin_users WHERE email = ?',
      [email.toLowerCase().trim()],
    );

    // Constant-time comparison — always run bcrypt to prevent timing attacks
    const dummy = '$2a$12$dummyhashfortimingprotectiononly.000000000000000000000000';
    const match = await comparePassword(password, admin?.password_hash ?? dummy);

    if (!admin || !match) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = signAdminToken({
      sub:   admin.id,
      email: admin.email,
      role:  admin.role,
      name:  admin.name,
    });

    const res = NextResponse.json({ ok: true, name: admin.name, role: admin.role });
    res.cookies.set({
      name:     ADMIN_COOKIE_NAME,
      value:    token,
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Admin cookie: strict (not lax) — no cross-site requests needed
      maxAge:   ADMIN_SESSION_MAX_AGE,
      path:     '/admin',  // Scope cookie to /admin only
    });
    return res;
  } catch (err) {
    console.error('[POST /api/admin/auth/login]', err);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
