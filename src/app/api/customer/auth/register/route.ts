import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { signCustomerToken } from '@/lib/customerAuth';
import { query, queryOne } from '@/lib/db';
import { normalizePhone } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone_number, password } = await req.json();

    // ── Validate ──────────────────────────────────────────────────────
    if (!name?.trim())    return NextResponse.json({ error: 'Name is required.' },     { status: 400 });
    if (!email?.trim())   return NextResponse.json({ error: 'Email is required.' },    { status: 400 });
    if (!phone_number)    return NextResponse.json({ error: 'Phone is required.' },    { status: 400 });
    if (!password)        return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const normPhone = normalizePhone(phone_number);
    if (!normPhone) return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });

    const normEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    // ── Check duplicates ──────────────────────────────────────────────
    const existingPhone = await queryOne<{ id: string }>(
      'SELECT id FROM customers WHERE phone_number = ?', [normPhone]
    );
    if (existingPhone) return NextResponse.json({ error: 'An account with this phone number already exists.' }, { status: 409 });

    const existingEmail = await queryOne<{ id: string }>(
      'SELECT id FROM customers WHERE email = ?', [normEmail]
    );
    if (existingEmail) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });

    // ── Create customer ───────────────────────────────────────────────
    const password_hash = await hashPassword(password);
    await query(
      `INSERT INTO customers (phone_number, name, email, password_hash)
       VALUES (?, ?, ?, ?)`,
      [normPhone, name.trim(), normEmail, password_hash]
    );

    const customer = await queryOne<{ id: string; name: string }>(
      'SELECT id, name FROM customers WHERE phone_number = ?', [normPhone]
    );
    if (!customer) return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });

    const token = signCustomerToken({ sub: customer.id, phone: normPhone });
    const digits = normPhone.replace('+91', '');

    return NextResponse.json({
      ok: true,
      token,
      customer: { id: customer.id, name: customer.name, phone: digits, email: normEmail },
    });
  } catch (err) {
    console.error('[POST /api/customer/auth/register]', err);
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
}
