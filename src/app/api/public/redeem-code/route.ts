import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import crypto from 'crypto';

// POST /api/public/redeem-code
// Customer (no auth) generates a 6-digit redemption code after reward unlocks.
// Body: { phone_number, slug }
export async function POST(req: NextRequest) {
  try {
    const { phone_number, slug } = await req.json();

    if (!phone_number || !slug) {
      return NextResponse.json({ error: 'phone_number and slug are required.' }, { status: 400 });
    }

    // Normalise phone: strip non-digits, strip leading 91/0
    const digits = String(phone_number).replace(/\D/g, '').replace(/^(91|0)/, '');
    if (digits.length !== 10) {
      return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });
    }
    const normPhone = `+91${digits}`;

    // Look up merchant
    const merchant = await queryOne<{ id: string; business_name: string }>(
      'SELECT id, business_name FROM merchants WHERE slug = ? AND status = "active"',
      [slug],
    );
    if (!merchant) return NextResponse.json({ error: 'Merchant not found.' }, { status: 404 });

    // Look up customer
    const customer = await queryOne<{ id: string; name: string | null }>(
      'SELECT id, name FROM customers WHERE phone_number = ?',
      [normPhone],
    );
    if (!customer) return NextResponse.json({ error: 'No loyalty account found for this number.' }, { status: 404 });

    // Find unlocked reward
    const cm = await queryOne<{
      id:                  string;
      reward_description:  string;
      progress:            number;
      reward_threshold:    number;
    }>(`
      SELECT cm.id, c.reward_description, cm.progress, c.reward_threshold
      FROM customer_merchant cm
      JOIN campaigns c ON c.id = cm.campaign_id
      WHERE cm.customer_id = ?
        AND cm.merchant_id = ?
        AND cm.reward_status = 'unlocked'
        AND c.status = 'active'
      LIMIT 1
    `, [customer.id, merchant.id]);

    if (!cm) {
      return NextResponse.json({ error: 'No unlocked reward found.' }, { status: 404 });
    }

    // Invalidate any existing active codes for this customer+merchant
    await query(
      'UPDATE redeem_codes SET status = "expired" WHERE customer_id = ? AND merchant_id = ? AND status = "active"',
      [customer.id, merchant.id],
    );

    // Generate 6-digit code (zero-padded)
    const code = String(Math.floor(100000 + crypto.randomInt(900000))).slice(0, 6);

    // 10-minute expiry
    await query(
      `INSERT INTO redeem_codes (id, customer_merchant_id, merchant_id, customer_id, code, expires_at)
       VALUES (UUID(), ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
      [cm.id, merchant.id, customer.id, code],
    );

    return NextResponse.json({
      ok:                 true,
      code,
      customer_name:      customer.name,
      business_name:      merchant.business_name,
      reward_description: cm.reward_description,
      expires_minutes:    10,
    });
  } catch (err) {
    console.error('[POST /api/public/redeem-code]', err);
    return NextResponse.json({ error: 'Could not generate code.' }, { status: 500 });
  }
}
