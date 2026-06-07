import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { query, queryOne, withTransaction } from '@/lib/db';

type RouteContext = { params: Promise<{ slug: string }> };

// POST /api/merchant/[slug]/validate
// Body: { phone_number, code }
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug }   = await params;
    const auth       = requireMerchant(req, slug);
    const merchantId = auth.sub;

    const { phone_number, code } = await req.json();

    if (!phone_number || !code) {
      return NextResponse.json({ error: 'phone_number and code are required.' }, { status: 400 });
    }

    const digits = String(phone_number).replace(/\D/g, '').replace(/^(91|0)/, '');
    if (digits.length !== 10) {
      return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });
    }
    const normPhone = `+91${digits}`;
    const cleanCode = String(code).replace(/\D/g, '').slice(0, 6);

    // Look up customer
    const customer = await queryOne<{ id: string; name: string | null }>(
      'SELECT id, name FROM customers WHERE phone_number = ?',
      [normPhone],
    );
    if (!customer) {
      return NextResponse.json({ error: 'No customer found with this phone number.' }, { status: 404 });
    }

    // Look up active code
    const rc = await queryOne<{ id: string; customer_merchant_id: string }>(
      `SELECT id, customer_merchant_id
       FROM redeem_codes
       WHERE customer_id = ?
         AND merchant_id = ?
         AND code        = ?
         AND status      = 'active'
         AND expires_at  > NOW()
       LIMIT 1`,
      [customer.id, merchantId, cleanCode],
    );

    if (!rc) {
      return NextResponse.json(
        { error: 'Invalid or expired code. Ask the customer to generate a new one.' },
        { status: 422 },
      );
    }

    // Confirm inside transaction
    const result = await withTransaction(async (client) => {
      // Re-verify reward still unlocked (lock the row)
      const cm = await client.query(
        `SELECT cm.id, cm.progress, cm.reward_status, cm.cycle_number, cm.campaign_id,
                c.reward_threshold, c.reward_description
         FROM customer_merchant cm
         JOIN campaigns c ON c.id = cm.campaign_id
         WHERE cm.id = ? FOR UPDATE`,
        [rc.customer_merchant_id],
      );
      const row = cm.rows[0] as {
        id: string; progress: number; reward_status: string;
        cycle_number: number; campaign_id: string;
        reward_threshold: number; reward_description: string;
      } | undefined;

      if (!row || row.reward_status !== 'unlocked') {
        throw Object.assign(new Error('NOT_UNLOCKED'), { code: 'NOT_UNLOCKED' });
      }

      const carryOver = Math.max(0, row.progress - row.reward_threshold);
      const newCycle  = row.cycle_number + 1;

      // Mark code used
      await client.query(
        'UPDATE redeem_codes SET status = "used", used_at = NOW() WHERE id = ?',
        [rc.id],
      );

      // Reset customer progress
      await client.query(
        `UPDATE customer_merchant
         SET progress = ?, reward_status = 'in_progress', cycle_number = ?, updated_at = NOW()
         WHERE id = ?`,
        [carryOver, newCycle, row.id],
      );

      // Log redemption
      await client.query(
        `INSERT INTO redemptions (id, customer_id, merchant_id, campaign_id, cycle_number, points_spent, redeemed_at)
         VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
        [customer.id, merchantId, row.campaign_id, row.cycle_number, row.reward_threshold],
      );

      return {
        customer_name:      customer.name,
        reward_description: row.reward_description,
        carry_over:         carryOver,
        new_cycle:          newCycle,
      };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    const code = (err as { code?: string }).code;
    if (code === 'NOT_UNLOCKED') {
      return NextResponse.json({ error: 'Reward already redeemed or not unlocked.' }, { status: 409 });
    }
    console.error('[POST /api/merchant/[slug]/validate]', err);
    return NextResponse.json({ error: 'Validation failed.' }, { status: 500 });
  }
}
