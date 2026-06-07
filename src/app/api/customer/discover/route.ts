import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/customer/discover?phone=9876543210
// Returns active merchants the customer has NOT joined yet
export async function GET(req: NextRequest) {
  try {
    const phone = req.nextUrl.searchParams.get('phone');
    const digits = phone ? String(phone).replace(/\D/g, '').replace(/^(91|0)/, '') : '';

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
    console.error('[GET /api/customer/discover]', err);
    return NextResponse.json({ error: 'Failed to load stores.' }, { status: 500 });
  }
}
