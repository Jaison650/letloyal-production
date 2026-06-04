import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { comparePassword, signAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { ADMIN_SESSION_MAX_AGE } from '@/lib/constants';

interface AdminRow {
  id:            string;
  email:         string;
  password_hash: string;
  name:          string;
  role:          'superadmin' | 'staff';
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const admin = await queryOne<AdminRow>(
      'SELECT id, email, password_hash, name, role FROM admin_users WHERE email = ?',
      [email.toLowerCase().trim()],
    );

    // Constant-time comparison
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
      sameSite: 'lax',
      maxAge:   ADMIN_SESSION_MAX_AGE,
      path:     '/',
    });
    return res;
  } catch (err) {
    console.error('[POST /api/admin/auth/login]', err);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
