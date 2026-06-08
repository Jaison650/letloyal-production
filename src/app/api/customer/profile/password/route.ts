// src/app/api/customer/profile/password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/customerAuth';
import { comparePassword, hashPassword } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const auth = requireCustomer(req);
    const { current_password, new_password } = await req.json();

    if (!current_password) return NextResponse.json({ error: 'Current password is required.' }, { status: 400 });
    if (!new_password)     return NextResponse.json({ error: 'New password is required.' },     { status: 400 });
    if (new_password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const customer = await queryOne<{ password_hash: string | null }>(
      'SELECT password_hash FROM customers WHERE id = ?', [auth.sub]
    );
    if (!customer) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

    if (customer.password_hash) {
      const valid = await comparePassword(current_password, customer.password_hash);
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    const new_hash = await hashPassword(new_password);
    await query('UPDATE customers SET password_hash = ? WHERE id = ?', [new_hash, auth.sub]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[PUT /api/customer/profile/password]', err);
    return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
  }
}
