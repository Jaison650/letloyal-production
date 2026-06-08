import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMerchantFromCookies } from '@/lib/session';
import { query, queryOne } from '@/lib/db';
import { maskPhone } from '@/lib/utils';
import { Users, Gift, TrendingUp, BarChart2 } from 'lucide-react';
import { WhatsAppButton } from '@/components/merchant/WhatsAppButton';

type PageProps = { params: Promise<{ slug: string }> };

interface GenderStat  { label: string; count: number; pct: number; }
interface AgeGroup    { label: string; count: number; pct: number; }
interface UpcomingBirthday { display_name: string; masked_phone: string; days_until: number; days_label: string; }

// ── Bar row component ───────────────────────────────────────────────────────
function BarRow({ label, pct, count, color }: { label: string; pct: number; count: number; color: string }) {
  const displayLabel: Record<string, string> = {
    male: 'Male', female: 'Female', other: 'Other',
    not_shared: 'Not shared', prefer_not_to_say: 'Prefer not to say',
    under_18: 'Under 18', '18-24': '18–24', '25-34': '25–34',
    '35-44': '35–44', '45+': '45+',
  };
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-text-dark">{displayLabel[label] ?? label}</span>
        <span className="text-sm font-bold text-text-dark">{pct}% <span className="text-xs text-text-light font-normal">({count})</span></span>
      </div>
      <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { slug } = await params;
  await cookies();
  const merchant = await getMerchantFromCookies();
  if (!merchant || merchant.slug !== slug) redirect('/merchant/login');

  const merchantId = merchant.id;

  // ── Fetch all analytics data ─────────────────────────────────────────
  const [genderRows, ageRows, birthdayRows, noAgeRow, totalCustomers] = await Promise.all([

    query<{ gender: string | null; cnt: number }>(`
      SELECT cu.gender, COUNT(*) AS cnt
      FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ?
      GROUP BY cu.gender
    `, [merchantId]),

    query<{ age_group: string; cnt: number }>(`
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
      WHERE cm.merchant_id = ? AND cu.birthday IS NOT NULL
      GROUP BY age_group
    `, [merchantId]),

    query<{ name: string | null; phone_number: string; days_until: number }>(`
      SELECT cu.name, cu.phone_number,
        DATEDIFF(
          DATE(CONCAT(
            IF(DATE_FORMAT(CURDATE(),'%m-%d') <= DATE_FORMAT(cu.birthday,'%m-%d'),
               YEAR(CURDATE()), YEAR(CURDATE()) + 1),
            '-', DATE_FORMAT(cu.birthday,'%m-%d')
          )),
          CURDATE()
        ) AS days_until
      FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ? AND cu.birthday IS NOT NULL
      HAVING days_until BETWEEN 0 AND 30
      ORDER BY days_until ASC
    `, [merchantId]),

    queryOne<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ? AND cu.birthday IS NULL
    `, [merchantId]),

    queryOne<{ cnt: number }>(
      'SELECT COUNT(DISTINCT customer_id) AS cnt FROM customer_merchant WHERE merchant_id = ?',
      [merchantId]
    ),
  ]);

  // ── Process gender ───────────────────────────────────────────────────
  const genderMap: Record<string, number> = { male: 0, female: 0, other: 0, prefer_not_to_say: 0, not_shared: 0 };
  let totalGender = 0;
  for (const row of genderRows) {
    const key = row.gender ?? 'not_shared';
    genderMap[key] = (genderMap[key] ?? 0) + Number(row.cnt);
    totalGender += Number(row.cnt);
  }
  const genderStats: GenderStat[] = Object.entries(genderMap)
    .filter(([, c]) => c > 0)
    .map(([label, count]) => ({ label, count, pct: totalGender > 0 ? Math.round((count / totalGender) * 100) : 0 }));

  // ── Process age groups ───────────────────────────────────────────────
  const ageOrder = ['under_18', '18-24', '25-34', '35-44', '45+'];
  const ageMap: Record<string, number> = {};
  let totalAge = 0;
  for (const row of ageRows) { ageMap[row.age_group] = Number(row.cnt); totalAge += Number(row.cnt); }
  const ageGroups: AgeGroup[] = ageOrder
    .filter(g => (ageMap[g] ?? 0) > 0)
    .map(g => ({ label: g, count: ageMap[g] ?? 0, pct: totalAge > 0 ? Math.round(((ageMap[g] ?? 0) / totalAge) * 100) : 0 }));

  // ── Process birthdays ────────────────────────────────────────────────
  const upcomingBirthdays: UpcomingBirthday[] = birthdayRows.map(r => ({
    display_name: r.name ? r.name.split(' ')[0] : 'Customer',
    masked_phone: maskPhone(r.phone_number),
    days_until:   Number(r.days_until),
    days_label:   Number(r.days_until) === 0 ? 'Today! 🎂'
                : Number(r.days_until) === 1 ? 'Tomorrow'
                : `In ${r.days_until} days`,
  }));

  const genderColors: Record<string, string> = {
    male: 'bg-primary', female: 'bg-purple-400',
    other: 'bg-amber-400', not_shared: 'bg-gray-300', prefer_not_to_say: 'bg-gray-300',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
          <BarChart2 size={24} className="text-primary" /> Customer Analytics
        </h1>
        <p className="text-text-light text-sm mt-1">
          Based on {totalCustomers?.cnt ?? 0} total customers · Only customers who shared their details are included in breakdowns
        </p>
      </div>

      {/* Gender + Age side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Gender */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-primary" />
            <h2 className="font-semibold text-text-dark">Gender Split</h2>
          </div>
          {genderStats.length === 0 ? (
            <p className="text-sm text-text-light py-4 text-center">No gender data yet — customers can add this in their profile.</p>
          ) : (
            <>
              {genderStats.map(s => (
                <BarRow key={s.label} label={s.label} pct={s.pct} count={s.count}
                  color={genderColors[s.label] ?? 'bg-gray-300'} />
              ))}
              <p className="text-xs text-text-light mt-2">Based on {totalGender} customers who shared gender</p>
            </>
          )}
        </div>

        {/* Age */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="font-semibold text-text-dark">Age Groups</h2>
          </div>
          {ageGroups.length === 0 ? (
            <p className="text-sm text-text-light py-4 text-center">No age data yet — customers can add birthday in their profile.</p>
          ) : (
            <>
              {ageGroups.map(g => (
                <BarRow key={g.label} label={g.label} pct={g.pct} count={g.count} color="bg-amber-400" />
              ))}
              <p className="text-xs text-text-light mt-2">
                Based on {totalAge} customers · {noAgeRow?.cnt ?? 0} have not shared birthday
              </p>
            </>
          )}
        </div>
      </div>

      {/* Upcoming Birthdays */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-primary" />
            <h2 className="font-semibold text-text-dark">Upcoming Birthdays</h2>
            <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Next 30 days</span>
          </div>
          {upcomingBirthdays.length > 0 && (
            <span className="text-sm text-text-light">{upcomingBirthdays.length} birthday{upcomingBirthdays.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {upcomingBirthdays.length === 0 ? (
          <p className="text-sm text-text-light py-6 text-center">No upcoming birthdays in the next 30 days.</p>
        ) : (
          <div className="space-y-3">
            {upcomingBirthdays.map((b, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${
                b.days_until <= 1 ? 'bg-amber-50 border-amber-200' : 'bg-surface border-border-light'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                    b.days_until <= 1 ? 'bg-amber-100' : 'bg-primary-light'
                  }`}>🎂</div>
                  <div>
                    <p className="text-sm font-semibold text-text-dark">{b.display_name}</p>
                    <p className="text-xs text-text-light">
                      {b.masked_phone} · <strong className={b.days_until <= 1 ? 'text-amber-700' : 'text-text-medium'}>{b.days_label}</strong>
                    </p>
                  </div>
                </div>
                <WhatsAppButton />
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-primary-light rounded-xl border border-primary/20">
          <p className="text-xs text-primary">
            📌 Only first name and masked phone are shown. Full date of birth is never displayed.
          </p>
        </div>
      </div>
    </div>
  );
}
