import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerAuth';
import { queryOne } from '@/lib/db';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const customer = await queryOne<{
    id: string; name: string | null; phone_number: string | null;
    email: string | null; birthday: string | null; gender: string | null;
  }>(
    'SELECT id, name, phone_number, email, birthday, gender FROM customers WHERE id = ?',
    [session.sub]
  );
  if (!customer) return NextResponse.json({ ok: false }, { status: 401 });

  const digits = customer.phone_number ? customer.phone_number.replace('+91', '') : '';

  return NextResponse.json({
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
}
