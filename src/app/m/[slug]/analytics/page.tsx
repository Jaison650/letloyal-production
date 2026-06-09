import { redirect } from 'next/navigation';
import { getMerchantFromCookies } from '@/lib/session';
import { query, queryOne } from '@/lib/db';
import { maskPhone } from '@/lib/utils';
import InsightsClient from '@/components/merchant/InsightsClient';

type PageProps = { params: Promise<{ slug: string }> };

export default async function AnalyticsPage({ params }: PageProps) {
  const { slug } = await params;
  const merchant  = await getMerchantFromCookies();
  if (!merchant || merchant.slug !== slug) redirect('/merchant/login');
  const mid = merchant.id;

  // ── All data fetched in parallel ─────────────────────────────────────
  const [
    overviewRow,
    redemptionRow,
    trend30,
    peakDays,
    segmentRow,
    topCustomers,
    genderRows,
    ageRows,
    birthdayRows,
    noAgeRow,
    customerList,
    blastData,
    subCountRow,
    blastsUsedRow,
  ] = await Promise.all([

    // Overview counts
    queryOne<{ total: number; this_week: number; this_month: number; total_visits: number }>(`
      SELECT
        COUNT(DISTINCT cm.customer_id)                                        AS total,
        COUNT(DISTINCT CASE WHEN v.created_at >= NOW() - INTERVAL 7 DAY
                            THEN v.customer_id END)                           AS this_week,
        COUNT(DISTINCT CASE WHEN MONTH(v.created_at) = MONTH(NOW())
                             AND YEAR(v.created_at)  = YEAR(NOW())
                            THEN v.customer_id END)                           AS this_month,
        COUNT(v.id)                                                           AS total_visits
      FROM customer_merchant cm
      LEFT JOIN visits v ON v.customer_id = cm.customer_id AND v.merchant_id = cm.merchant_id
      WHERE cm.merchant_id = ?
    `, [mid]),

    // Redemptions
    queryOne<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM redeem_codes WHERE merchant_id = ? AND status = 'used'`,
      [mid],
    ),

    // 30-day daily trend
    query<{ visit_date: string; count: number }>(`
      SELECT DATE(created_at) AS visit_date, COUNT(*) AS count
      FROM visits
      WHERE merchant_id = ? AND created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY DATE(created_at)
      ORDER BY visit_date ASC
    `, [mid]),

    // Peak days of week
    query<{ dow: number; day_name: string; count: number }>(`
      SELECT DAYOFWEEK(created_at) AS dow, DAYNAME(created_at) AS day_name, COUNT(*) AS count
      FROM visits WHERE merchant_id = ?
      GROUP BY DAYOFWEEK(created_at), DAYNAME(created_at)
      ORDER BY dow
    `, [mid]),

    // Frequency segments
    queryOne<{ new_count: number; regular_count: number; loyal_count: number; at_risk_count: number }>(`
      SELECT
        SUM(CASE WHEN visit_count = 1 THEN 1 ELSE 0 END)                                    AS new_count,
        SUM(CASE WHEN visit_count BETWEEN 2 AND 9 THEN 1 ELSE 0 END)                        AS regular_count,
        SUM(CASE WHEN visit_count >= 10 THEN 1 ELSE 0 END)                                  AS loyal_count,
        SUM(CASE WHEN last_visit < NOW() - INTERVAL 30 DAY AND visit_count > 1 THEN 1 ELSE 0 END) AS at_risk_count
      FROM (
        SELECT customer_id, COUNT(*) AS visit_count, MAX(created_at) AS last_visit
        FROM visits WHERE merchant_id = ?
        GROUP BY customer_id
      ) t
    `, [mid]),

    // Top 5 customers
    query<{ name: string | null; phone_number: string; visit_count: number; last_visit: string }>(`
      SELECT c.name, c.phone_number, COUNT(v.id) AS visit_count, MAX(v.created_at) AS last_visit
      FROM visits v JOIN customers c ON c.id = v.customer_id
      WHERE v.merchant_id = ?
      GROUP BY v.customer_id
      ORDER BY visit_count DESC LIMIT 5
    `, [mid]),

    // Gender
    query<{ gender: string | null; cnt: number }>(`
      SELECT cu.gender, COUNT(*) AS cnt
      FROM customer_merchant cm JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ? GROUP BY cu.gender
    `, [mid]),

    // Age
    query<{ age_group: string; cnt: number }>(`
      SELECT
        CASE
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) < 18              THEN 'under_18'
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) BETWEEN 18 AND 24 THEN '18-24'
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) BETWEEN 25 AND 34 THEN '25-34'
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) BETWEEN 35 AND 44 THEN '35-44'
          ELSE '45+'
        END AS age_group, COUNT(*) AS cnt
      FROM customer_merchant cm JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ? AND cu.birthday IS NOT NULL GROUP BY age_group
    `, [mid]),

    // Upcoming birthdays (30 days)
    query<{ name: string | null; phone_number: string; days_until: number }>(`
      SELECT cu.name, cu.phone_number,
        DATEDIFF(DATE(CONCAT(
          IF(DATE_FORMAT(CURDATE(),'%m-%d') <= DATE_FORMAT(cu.birthday,'%m-%d'),
             YEAR(CURDATE()), YEAR(CURDATE()) + 1),
          '-', DATE_FORMAT(cu.birthday,'%m-%d')
        )), CURDATE()) AS days_until
      FROM customer_merchant cm JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ? AND cu.birthday IS NOT NULL
      HAVING days_until BETWEEN 0 AND 30 ORDER BY days_until ASC
    `, [mid]),

    // No birthday count
    queryOne<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ? AND cu.birthday IS NULL
    `, [mid]),

    // Full customer list
    query<{
      customer_id: string; name: string | null; phone_number: string;
      progress: number; reward_threshold: number; reward_status: string;
      total_visits: number; last_scan_at: string | null;
      current_streak: number; streak_period: string; streak_enabled: number;
    }>(`
      SELECT c.id AS customer_id, c.name, c.phone_number,
             cm.progress, ca.reward_threshold, cm.reward_status,
             cm.last_scan_at, cm.current_streak, ca.streak_period, ca.streak_enabled,
             (SELECT COUNT(*) FROM visits v WHERE v.customer_id = c.id AND v.merchant_id = m.id) AS total_visits
      FROM customer_merchant cm
      JOIN customers  c  ON c.id  = cm.customer_id
      JOIN merchants  m  ON m.id  = cm.merchant_id
      JOIN campaigns  ca ON ca.id = cm.campaign_id
      WHERE m.slug = ?
      ORDER BY cm.last_scan_at DESC
    `, [slug]),

    // Recent blasts
    query<{ id: string; title: string; body: string; recipient_count: number; sent_at: string }>(`
      SELECT id, title, body, recipient_count, sent_at
      FROM push_blasts WHERE merchant_id = ?
      ORDER BY sent_at DESC LIMIT 10
    `, [mid]),

    // Customer push subscriber count
    queryOne<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt FROM push_subscriptions
      WHERE owner_type = 'customer' AND merchant_id = ?
    `, [mid]),

    // Blasts used in last 30 days
    queryOne<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt FROM push_blasts
      WHERE merchant_id = ? AND sent_at >= NOW() - INTERVAL 30 DAY
    `, [mid]),
  ]);

  // ── Process gender ─────────────────────────────────────────────────────
  const genderMap: Record<string, number> = { male: 0, female: 0, other: 0, prefer_not_to_say: 0, not_shared: 0 };
  let totalGender = 0;
  for (const r of genderRows) {
    const k = r.gender ?? 'not_shared';
    genderMap[k] = (genderMap[k] ?? 0) + Number(r.cnt);
    totalGender += Number(r.cnt);
  }
  const genderStats = Object.entries(genderMap)
    .filter(([, c]) => c > 0)
    .map(([label, count]) => ({ label, count, pct: totalGender ? Math.round((count / totalGender) * 100) : 0 }));

  // ── Process age ────────────────────────────────────────────────────────
  const ageOrder = ['under_18', '18-24', '25-34', '35-44', '45+'];
  const ageMap: Record<string, number> = {};
  let totalAge = 0;
  for (const r of ageRows) { ageMap[r.age_group] = Number(r.cnt); totalAge += Number(r.cnt); }
  const ageGroups = ageOrder.filter(g => (ageMap[g] ?? 0) > 0)
    .map(g => ({ label: g, count: ageMap[g] ?? 0, pct: totalAge ? Math.round(((ageMap[g] ?? 0) / totalAge) * 100) : 0 }));

  // ── Process birthdays ──────────────────────────────────────────────────
  const upcomingBirthdays = birthdayRows.map(r => ({
    display_name: r.name ? r.name.split(' ')[0] : 'Customer',
    masked_phone: maskPhone(r.phone_number),
    days_until:   Number(r.days_until),
    days_label:   Number(r.days_until) === 0 ? 'Today! 🎂' : Number(r.days_until) === 1 ? 'Tomorrow' : `In ${r.days_until} days`,
  }));

  // ── Build 30-day grid (fill missing dates with 0) ─────────────────────
  const trendMap: Record<string, number> = {};
  for (const r of trend30) trendMap[r.visit_date] = Number(r.count);
  const trend30Grid = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const key = d.toLocaleDateString('en-CA');
    return { date: key, count: trendMap[key] ?? 0 };
  });

  const avgVisits = overviewRow?.total
    ? Math.round(((overviewRow.total_visits ?? 0) / overviewRow.total) * 10) / 10
    : 0;

  return (
    <InsightsClient
      slug={slug}
      merchantId={mid}
      vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''}
      stats={{
        totalCustomers:    overviewRow?.total ?? 0,
        visitsThisWeek:    overviewRow?.this_week ?? 0,
        visitsThisMonth:   overviewRow?.this_month ?? 0,
        totalVisits:       overviewRow?.total_visits ?? 0,
        redemptions:       redemptionRow?.cnt ?? 0,
        avgVisitsPerCustomer: avgVisits,
      }}
      trend30={trend30Grid}
      peakDays={peakDays.map(r => ({ day: r.day_name.slice(0, 3), count: Number(r.count) }))}
      segments={{
        new:     Number(segmentRow?.new_count     ?? 0),
        regular: Number(segmentRow?.regular_count ?? 0),
        loyal:   Number(segmentRow?.loyal_count   ?? 0),
        atRisk:  Number(segmentRow?.at_risk_count ?? 0),
      }}
      topCustomers={topCustomers.map(r => ({
        name:        r.name,
        phone:       maskPhone(r.phone_number),
        visit_count: Number(r.visit_count),
        last_visit:  r.last_visit,
      }))}
      genderStats={genderStats}
      ageGroups={ageGroups}
      noAgeCount={noAgeRow?.cnt ?? 0}
      upcomingBirthdays={upcomingBirthdays}
      customers={customerList.map(c => ({
        ...c,
        progress:        Number(c.progress),
        reward_threshold:Number(c.reward_threshold),
        total_visits:    Number(c.total_visits),
        current_streak:  Number(c.current_streak),
        streak_enabled:  Number(c.streak_enabled),
      }))}
      blasts={blastData}
      customerSubCount={Number(subCountRow?.cnt ?? 0)}
      blastsUsed={Number(blastsUsedRow?.cnt ?? 0)}
      blastLimit={4}
    />
  );
}
