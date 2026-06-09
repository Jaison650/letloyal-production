import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { pushToMerchant } from '@/lib/webpush';

type RouteContext = { params: Promise<{ slug: string }> };

// ── POST /api/merchant/[slug]/redeem/confirm ──────────────────────────
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const auth = requireMerchant(req, slug);

    const { customer_merchant_id } = await req.json();

    if (!customer_merchant_id) {
      return NextResponse.json(
        { error: 'customer_merchant_id is required.' },
        { status: 400 },
      );
    }

    const result = await withTransaction(async (client) => {

      // ── Re-verify inside transaction (prevents double-redeem race) ──
      const cmRows = await client.query(
        `SELECT cm.id, cm.customer_id, cm.merchant_id, cm.campaign_id,
                cm.progress, cm.cycle_number, cm.reward_status,
                ca.reward_threshold, ca.reward_description,
                cu.name AS customer_name
           FROM customer_merchant cm
           JOIN campaigns ca ON cm.campaign_id = ca.id
           JOIN customers cu ON cm.customer_id = cu.id
          WHERE cm.id         = ?
            AND cm.merchant_id = ?`,
        [customer_merchant_id, auth.sub],
      );

      if (cmRows.rows.length === 0) {
        throw Object.assign(
          new Error('NOT_FOUND'),
          { code: 'NOT_FOUND' },
        );
      }

      const cm = cmRows.rows[0] as {
        id:                 string;
        customer_id:        string;
        merchant_id:        string;
        campaign_id:        string;
        progress:           number;
        cycle_number:       number;
        reward_status:      string;
        reward_threshold:   number;
        reward_description: string;
        customer_name:      string | null;
      };

      // Guard: still unlocked? (could have changed between lookup and confirm)
      if (cm.reward_status !== 'unlocked') {
        throw Object.assign(
          new Error('NOT_UNLOCKED'),
          { code: 'NOT_UNLOCKED' },
        );
      }

      // ── Carry-over math ─────────────────────────────────────────────
      // Customer may have scanned above threshold (e.g. 12 stamps at threshold 10)
      // Carry-over = progress - threshold, floored at 0
      const carryOver = Math.max(0, cm.progress - cm.reward_threshold);

      // ── Insert redemption log ───────────────────────────────────────
      await client.query(
        `INSERT INTO redemptions
           (id, customer_id, merchant_id, campaign_id, cycle_number, points_spent)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          cm.customer_id,
          cm.merchant_id,
          cm.campaign_id,
          cm.cycle_number,
          cm.reward_threshold,
        ],
      );

      // ── Reset customer_merchant ─────────────────────────────────────
      await client.query(
        `UPDATE customer_merchant
            SET progress      = ?,
                reward_status = 'in_progress',
                cycle_number  = cycle_number + 1
          WHERE id = ?`,
        [carryOver, cm.id],
      );

      return {
        reward_description: cm.reward_description,
        customer_name:      cm.customer_name,
        carry_over:         carryOver,
        new_cycle:          cm.cycle_number + 1,
        threshold:          cm.reward_threshold,
      };
    });

    // Fire-and-forget push to merchant
    pushToMerchant(
      auth.sub,
      '🎁 Reward Redeemed',
      `${result.customer_name ?? 'A customer'} just claimed: ${result.reward_description}`,
    ).catch(() => {});

    return NextResponse.json({
      ok:                 true,
      reward_description: result.reward_description,
      customer_name:      result.customer_name,
      carry_over:         result.carry_over,
      new_cycle:          result.new_cycle,
      message: result.carry_over > 0
        ? `Reward confirmed! ${result.carry_over} carry-over ${result.carry_over === 1 ? 'stamp' : 'stamps'} to Cycle ${result.new_cycle}.`
        : `Reward confirmed! Cycle ${result.new_cycle} started fresh.`,
    });

  } catch (err: unknown) {
    const code = (err as { code?: string }).code;

    if (code === 'NOT_FOUND') {
      return NextResponse.json(
        { error: 'Reward not found. It may have already been redeemed.' },
        { status: 404 },
      );
    }
    if (code === 'NOT_UNLOCKED') {
      return NextResponse.json(
        { error: 'This reward is no longer available to redeem.' },
        { status: 409 },
      );
    }

    if (err instanceof Response) return err;
    console.error('[POST /api/merchant/[slug]/redeem/confirm]', err);
    return NextResponse.json(
      { error: 'Redemption failed. Please try again.' },
      { status: 500 },
    );
  }
}
