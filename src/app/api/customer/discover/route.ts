import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireCustomer } from '@/lib/customerAuth';

// POST /api/customer/discover
// Body: { phone_number: string }
// Returns active merchants the customer has NOT joined yet
export async function POST(req: Request) {
  try {
    requireCustomer(req); // throws 401 if no valid token
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const { phone_number } = await req.json();
    const digits = phone_number ? String(phone_number).replace(/\D/g, '').replace(/^(91|0)/, '') : '';

    const normPhone = digits.length === 10 ? `+91${digits}` : null;

    const rows = await query<{
      slug:               string;
      business_name:      string;
      logo_url:           string | null;
      campaign_name:      string;
      campaign_type:      string;
      reward_description: string;
      reward_threshold:   number;
    }>(`
      SELECT
        m.slug,
        m.business_name,
        m.logo_url,
        c.name            AS campaign_name,
        c.campaign_type,
        c.reward_description,
        c.reward_threshold
      FROM merchants m
      JOIN campaigns c ON c.merchant_id = m.id AND c.status = 'active'
      WHERE m.status = 'active'
        ${normPhone ? `AND m.id NOT IN (
          SELECT cm.merchant_id FROM customer_merchant cm
          JOIN customers cu ON cu.id = cm.customer_id
          WHERE cu.phone_number = ?
        )` : ''}
      ORDER BY m.created_at DESC
      LIMIT 8
    `, normPhone ? [normPhone] : []);

    return NextResponse.json({ ok: true, stores: rows });
  } catch (err) {
    console.error('[POST /api/customer/discover]', err);
    return NextResponse.json({ error: 'Failed to load stores.' }, { status: 500 });
  }
}
