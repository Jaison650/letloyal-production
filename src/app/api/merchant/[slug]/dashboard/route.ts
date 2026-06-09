import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { maskPhone } from '@/lib/utils';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const auth = requireMerchant(req, slug);
    const merchantId = auth.sub;

    // ── Run all queries in parallel ──────────────────────────────────────
    const [
      statsRow,
      campaign,
      recentVisits,
      insightRows,
    ] = await Promise.all([

      // 1. Stats
      queryOne<{
        scans_today:      number;
        active_customers: number;
        redeemed_week:    number;
      }>(`
        SELECT
          (SELECT COUNT(*) FROM visits
            WHERE merchant_id = ? AND DATE(created_at) = CURDATE())         AS scans_today,
          (SELECT COUNT(DISTINCT customer_id) FROM customer_merchant
            WHERE merchant_id = ?)                                           AS active_customers,
          (SELECT COUNT(*) FROM redemptions
            WHERE merchant_id = ?
              AND redeemed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))            AS redeemed_week
      `, [merchantId, merchantId, merchantId]),

      // 2. Active campaign + member count + redeemed count
      queryOne<{
        id:                  string;
        name:                string;
        campaign_type:       string;
        reward_threshold:    number;
        reward_description:  string;
        member_count:        number;
        redeemed_count:      number;
      }>(`
        SELECT
          c.id, c.name, c.campaign_type,
          c.reward_threshold, c.reward_description,
          COUNT(DISTINCT cm.customer_id)  AS member_count,
          (SELECT COUNT(*) FROM redemptions r
            WHERE r.campaign_id = c.id)   AS redeemed_count
        FROM campaigns c
        LEFT JOIN customer_merchant cm ON cm.campaign_id = c.id
        WHERE c.merchant_id = ? AND c.status = 'active'
        GROUP BY c.id
        LIMIT 1
      `, [merchantId]),

      // 3. Recent 10 visits
      query<{
        customer_name:  string | null;
        phone_number:   string;
        points_added:   number;
        amount_rupees:  number | null;
        created_at:     string;
      }>(`
        SELECT
          cu.name          AS customer_name,
          cu.phone_number,
          v.points_added,
          v.amount_rupees,
          v.created_at
        FROM visits v
        JOIN customers cu ON cu.id = v.customer_id
        WHERE v.merchant_id = ?
        ORDER BY v.created_at DESC
        LIMIT 10
      `, [merchantId]),

      // 4. Insights: close-to-reward + pending redemptions
      query<{
        type:          string;
        customer_name: string | null;
        phone_number:  string;
        progress:      number;
        threshold:     number;
      }>(`
        SELECT
          CASE WHEN cm.reward_status = 'unlocked' THEN 'pending_redeem'
               ELSE 'close_to_reward' END              AS type,
          cu.name                                      AS customer_name,
          cu.phone_number,
          cm.progress,
          c.reward_threshold                           AS threshold
        FROM customer_merchant cm
        JOIN customers cu  ON cu.id  = cm.customer_id
        JOIN campaigns  c  ON c.id   = cm.campaign_id
        WHERE cm.merchant_id = ?
          AND c.status = 'active'
          AND (
            cm.reward_status = 'unlocked'
            OR (cm.reward_status = 'in_progress'
                AND c.reward_threshold > 0
                AND cm.progress / c.reward_threshold >= 0.75)
          )
        ORDER BY cm.reward_status DESC, cm.progress DESC
        LIMIT 20
      `, [merchantId]),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        scans_today:      statsRow?.scans_today      ?? 0,
        active_customers: statsRow?.active_customers ?? 0,
        redeemed_week:    statsRow?.redeemed_week    ?? 0,
      },
      campaign:      campaign   ?? null,
      recent_visits: recentVisits.map((v) => ({ ...v, phone_number: maskPhone(v.phone_number) })),
      insights:      insightRows.map((r) => ({ ...r, phone_number: maskPhone(r.phone_number) })),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[GET /api/merchant/[slug]/dashboard]', err);
    return NextResponse.json({ error: 'Failed to load dashboard.' }, { status: 500 });
  }
}
