// src/app/api/customer/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/customerAuth';
import { comparePassword } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { normalizePhone } from '@/lib/utils';

// GET /api/customer/profile — return own profile
export async function GET(req: NextRequest) {
  try {
    const auth = requireCustomer(req);
    const customer = await queryOne<{
      id: string; name: string | null; phone_number: string;
      email: string | null; birthday: string | null; gender: string | null;
    }>(
      'SELECT id, name, phone_number, email, birthday, gender FROM customers WHERE id = ?',
      [auth.sub]
    );
    if (!customer) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const digits = customer.phone_number.replace('+91', '');
    return NextResponse.json({ ok: true, customer: { ...customer, phone: digits } });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[GET /api/customer/profile]', err);
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}

// PUT /api/customer/profile — update name/email/phone/birthday/gender
export async function PUT(req: NextRequest) {
  try {
    const auth = requireCustomer(req);
    const { name, email, phone_number, birthday, gender, current_password } = await req.json();

    const updates: string[] = [];
    const values:  unknown[] = [];

    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
      updates.push('name = ?'); values.push(name.trim());
    }

    if (email !== undefined) {
      const normEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
        return NextResponse.json({ error: 'Invalid email.' }, { status: 400 });
      }
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM customers WHERE email = ? AND id != ?', [normEmail, auth.sub]
      );
      if (existing) return NextResponse.json({ error: 'Email already in use.' }, { status: 409 });
      updates.push('email = ?'); values.push(normEmail);
    }

    if (phone_number !== undefined) {
      // Phone change requires current password
      if (!current_password) {
        return NextResponse.json({ error: 'Current password required to change phone number.' }, { status: 400 });
      }
      const customer = await queryOne<{ password_hash: string | null }>(
        'SELECT password_hash FROM customers WHERE id = ?', [auth.sub]
      );
      if (!customer?.password_hash) {
        return NextResponse.json({ error: 'Set a password before changing phone number.' }, { status: 400 });
      }
      const valid = await comparePassword(current_password, customer.password_hash);
      if (!valid) return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });

      const normPhone = normalizePhone(phone_number);
      if (!normPhone) return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });

      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM customers WHERE phone_number = ? AND id != ?', [normPhone, auth.sub]
      );
      if (existing) return NextResponse.json({ error: 'Phone number already in use.' }, { status: 409 });
      updates.push('phone_number = ?'); values.push(normPhone);
    }

    if (birthday !== undefined) {
      updates.push('birthday = ?');
      values.push(birthday === '' ? null : birthday); // 'YYYY-MM-DD' or null to clear
    }

    if (gender !== undefined) {
      const allowed = ['male', 'female', 'other', 'prefer_not_to_say', ''];
      if (!allowed.includes(gender)) {
        return NextResponse.json({ error: 'Invalid gender value.' }, { status: 400 });
      }
      updates.push('gender = ?');
      values.push(gender === '' ? null : gender);
    }

    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });

    values.push(auth.sub);
    await query(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[PUT /api/customer/profile]', err);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
