import { NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/customerAuth';
import { query } from '@/lib/db';

export async function DELETE(req: Request) {
  let payload;
  try {
    payload = requireCustomer(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    // Get customer ID from phone
    const rows = await query<{ id: string }>(
      'SELECT id FROM customers WHERE phone_number = ?',
      [payload.phone],
    );
    const customer = rows[0];

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // CASCADE handles: visits, redemptions, customer_merchant, redeem_codes, customer_reset_tokens
    await query('DELETE FROM customers WHERE id = ?', [customer.id]);

    return NextResponse.json({ ok: true, message: 'Your account and all associated data has been deleted.' });
  } catch (err) {
    console.error('[DELETE /api/customer/account]', err);
    return NextResponse.json({ error: 'Failed to delete account. Please try again.' }, { status: 500 });
  }
}
