import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, comparePassword, hashPassword } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(rateLimitKey(req, 'admin-change-pw'), 5, 15 * 60 * 1000);
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }
  try {
    const admin = requireAdmin(req);
    const { current_password, new_password } = await req.json();
    if (!current_password || !new_password)
      return NextResponse.json({ error: 'Both passwords required.' }, { status: 400 });
    if (new_password.length < 8)
      return NextResponse.json(
        { error: 'New password must be at least 8 characters.' },
        { status: 400 },
      );

    const row = await queryOne<{ password_hash: string }>(
      'SELECT password_hash FROM admin_users WHERE id = ?',
      [admin.sub],
    );
    if (!row) return NextResponse.json({ error: 'Admin not found.' }, { status: 404 });

    const match = await comparePassword(current_password, row.password_hash);
    if (!match)
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });

    const hash = await hashPassword(new_password);
    await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, admin.sub]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
