import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// POST /api/customer/lookup
// Public — customer enters phone, gets all their loyalty cards
export async function POST(req: NextRequest) {
  try {
    const { phone_number } = await req.json();
    if (!phone_number) return NextResponse.json({ error: 'phone_number required.' }, { status: 400 });

    const digits = String(phone_number).replace(/\D/g, '').replace(/^(91|0)/, '');
    if (digits.length !== 10) return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });
    const normPhone = `+91${digits}`;

    const customer = await queryOne<{ id: string; name: string | null; created_at: string; password_hash: string | null }>(
      'SELECT id, name, created_at, password_hash FROM customers WHERE phone_number = ?',
      [normPhone],
    );

    if (!customer) {
      return NextResponse.json({ ok: true, customer: null, has_password: false, cards: [] });
    }

    const cards = await query<{
      merchant_slug:      string;
      business_name:      string;
      logo_url:           string | null;
      brand_color:        string | null;
      campaign_name:      string;
      campaign_type:      string;
      progress:           number;
      reward_threshold:   number;
      reward_description: string;
      reward_status:      string;
      cycle_number:       number;
      last_scan_at:       string | null;
    }>(`
      SELECT
        m.slug            AS merchant_slug,
        m.business_name,
        m.logo_url,
        m.brand_color,
        c.name            AS campaign_name,
        c.campaign_type,
        cm.progress,
        c.reward_threshold,
        c.reward_description,
        cm.reward_status,
        cm.cycle_number,
        cm.last_scan_at
      FROM customer_merchant cm
      JOIN merchants  m ON m.id = cm.merchant_id
      JOIN campaigns  c ON c.id = cm.campaign_id
      WHERE cm.customer_id = ?
        AND c.status = 'active'
      ORDER BY cm.last_scan_at DESC
    `, [customer.id]);

    return NextResponse.json({
      ok: true,
      customer: { id: customer.id, name: customer.name, phone: digits },
      has_password: !!customer.password_hash,
      cards,
    });
  } catch (err) {
    console.error('[POST /api/customer/lookup]', err);
    return NextResponse.json({ error: 'Lookup failed.' }, { status: 500 });
  }
}
