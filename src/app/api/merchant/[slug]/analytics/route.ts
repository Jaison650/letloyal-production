// src/app/api/merchant/[slug]/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { maskPhone } from '@/lib/utils';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    requireMerchant(req, slug);

    const merchant = await queryOne<{ id: string }>(
      'SELECT id FROM merchants WHERE slug = ?', [slug]
    );
    if (!merchant) return NextResponse.json({ error: 'Merchant not found.' }, { status: 404 });

    const merchantId = merchant.id;

    // ── Gender stats ───────────────────────────────────────────────────
    const genderRows = await query<{ gender: string | null; cnt: number }>(`
      SELECT cu.gender, COUNT(*) AS cnt
      FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ?
      GROUP BY cu.gender
    `, [merchantId]);

    const genderMap: Record<string, number> = { male: 0, female: 0, other: 0, not_shared: 0 };
    let totalGender = 0;
    for (const row of genderRows) {
      const key = row.gender ?? 'not_shared';
      genderMap[key] = (genderMap[key] ?? 0) + Number(row.cnt);
      totalGender += Number(row.cnt);
    }
    const gender_stats = Object.entries(genderMap).map(([label, count]) => ({
      label,
      count,
      pct: totalGender > 0 ? Math.round((count / totalGender) * 100) : 0,
    }));

    // ── Age groups ─────────────────────────────────────────────────────
    const ageRows = await query<{ age_group: string; cnt: number }>(`
      SELECT
        CASE
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) < 18 THEN 'under_18'
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) BETWEEN 18 AND 24 THEN '18-24'
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) BETWEEN 25 AND 34 THEN '25-34'
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) BETWEEN 35 AND 44 THEN '35-44'
          ELSE '45+'
        END AS age_group,
        COUNT(*) AS cnt
      FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ?
        AND cu.birthday IS NOT NULL
      GROUP BY age_group
    `, [merchantId]);

    const ageOrder = ['under_18', '18-24', '25-34', '35-44', '45+'];
    const ageMap: Record<string, number> = {};
    let totalAge = 0;
    for (const row of ageRows) {
      ageMap[row.age_group] = Number(row.cnt);
      totalAge += Number(row.cnt);
    }
    const age_groups = ageOrder
      .filter(g => (ageMap[g] ?? 0) > 0)
      .map(g => ({
        label: g,
        count: ageMap[g] ?? 0,
        pct:   totalAge > 0 ? Math.round(((ageMap[g] ?? 0) / totalAge) * 100) : 0,
      }));

    const noAgeCount = await queryOne<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ? AND cu.birthday IS NULL
    `, [merchantId]);

    // ── Upcoming birthdays (next 30 days) ─────────────────────────────
    const birthdayRows = await query<{
      name: string | null; phone_number: string; days_until: number;
    }>(`
      SELECT
        cu.name,
        cu.phone_number,
        DATEDIFF(
          DATE(CONCAT(
            IF(
              DATE_FORMAT(CURDATE(), '%m-%d') <= DATE_FORMAT(cu.birthday, '%m-%d'),
              YEAR(CURDATE()),
              YEAR(CURDATE()) + 1
            ),
            '-',
            DATE_FORMAT(cu.birthday, '%m-%d')
          )),
          CURDATE()
        ) AS days_until
      FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ?
        AND cu.birthday IS NOT NULL
      HAVING days_until BETWEEN 0 AND 30
      ORDER BY days_until ASC
    `, [merchantId]);

    const upcoming_birthdays = birthdayRows.map(r => ({
      display_name:  r.name ? r.name.split(' ')[0] : 'Customer',
      masked_phone:  maskPhone(r.phone_number),
      days_until:    Number(r.days_until),
      days_label:    Number(r.days_until) === 0 ? 'Today! 🎂'
                   : Number(r.days_until) === 1 ? 'Tomorrow'
                   : `In ${r.days_until} days`,
    }));

    return NextResponse.json({
      ok: true,
      gender_stats,
      age_groups,
      age_not_shared: noAgeCount?.cnt ?? 0,
      upcoming_birthdays,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[GET /api/merchant/[slug]/analytics]', err);
    return NextResponse.json({ error: 'Failed to load analytics.' }, { status: 500 });
  }
}
