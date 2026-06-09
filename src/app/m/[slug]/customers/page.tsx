import { redirect } from 'next/navigation';
import { getMerchantFromCookies } from '@/lib/session';
import { query, queryOne } from '@/lib/db';
import { maskPhone } from '@/lib/utils';
import { Users, Crown, Clock, TrendingUp, Gift } from 'lucide-react';

type PageProps = { params: Promise<{ slug: string }> };

interface CustomerRow {
  customer_id:       string;
  name:              string | null;
  phone_number:      string;
  progress:          number;
  reward_threshold:  number;
  reward_status:     'in_progress' | 'unlocked';
  total_visits:      number;
  last_scan_at:      string | null;
  current_streak:    number;
  streak_period:     'day' | 'week' | 'month';
  streak_enabled:    number;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hrs   = Math.floor(mins / 60);
  const days  = Math.floor(hrs / 24);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hrs  < 24)  return `${hrs}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default async function CustomersPage({ params }: PageProps) {
  const { slug } = await params;
  const merchant  = await getMerchantFromCookies();
  if (!merchant || merchant.slug !== slug) redirect('/merchant/login');

  // ── Load all customers for this merchant ──────────────────────────────
  const customers = await query<CustomerRow>(
    `SELECT
       c.id              AS customer_id,
       c.name,
       c.phone_number,
       cm.progress,
       ca.reward_threshold,
       cm.reward_status,
       cm.last_scan_at,
       cm.current_streak,
       ca.streak_period,
       ca.streak_enabled,
       (SELECT COUNT(*) FROM visits v
          WHERE v.customer_id = c.id AND v.merchant_id = m.id) AS total_visits
     FROM customer_merchant cm
     JOIN customers c    ON c.id  = cm.customer_id
     JOIN merchants m    ON m.id  = cm.merchant_id
     JOIN campaigns ca   ON ca.id = cm.campaign_id
     WHERE m.slug = ?
     ORDER BY cm.last_scan_at DESC`,
    [slug],
  );

  // ── Summary stats ──────────────────────────────────────────────────────
  const total      = customers.length;
  const withReward = customers.filter(c => c.reward_status === 'unlocked').length;
  const activeThisWeek = customers.filter(c => {
    if (!c.last_scan_at) return false;
    return Date.now() - new Date(c.last_scan_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const totalVisits = customers.reduce((sum, c) => sum + Number(c.total_visits), 0);

  const periodLabel = (p: string) => p === 'week' ? 'wk' : p === 'month' ? 'mo' : 'd';

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-text-dark flex items-center gap-2">
          <Users size={20} className="text-primary" /> Customers
        </h1>
        <p className="text-sm text-text-light mt-0.5">Everyone who has scanned at your store</p>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',          value: total,         icon: <Users size={16} />,      color: 'text-primary'        },
          { label: 'Active (7d)',     value: activeThisWeek, icon: <Clock size={16} />,     color: 'text-green-600'      },
          { label: 'Reward Ready',   value: withReward,    icon: <Gift size={16} />,       color: 'text-amber-600'      },
          { label: 'Total Visits',   value: totalVisits,   icon: <TrendingUp size={16} />, color: 'text-blue-600'       },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-border-light px-4 py-3">
            <div className={`flex items-center gap-1.5 text-xs font-medium mb-1 ${s.color}`}>
              {s.icon} {s.label}
            </div>
            <p className="text-2xl font-bold text-text-dark">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Customer list ─────────────────────────────────────────────── */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border-light px-6 py-12 text-center text-text-light">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No customers yet</p>
          <p className="text-xs mt-1">Customers will appear here once they scan your QR code</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-light divide-y divide-border-light overflow-hidden">
          {customers.map((c) => {
            const pct = Math.min(100, Math.round((c.progress / c.reward_threshold) * 100));
            const hasReward = c.reward_status === 'unlocked';
            return (
              <div key={c.customer_id} className="px-4 py-3.5 flex items-center gap-4">

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0 relative">
                  <span className="text-sm font-bold text-primary">
                    {(c.name ?? c.phone_number).charAt(0).toUpperCase()}
                  </span>
                  {hasReward && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                      <Crown size={9} className="text-white" />
                    </span>
                  )}
                </div>

                {/* Name + phone + progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-dark truncate">
                      {c.name ?? 'Unknown'}
                    </p>
                    {hasReward && (
                      <span className="text-xs bg-amber-100 text-amber-700 font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Reward ready
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-light">{maskPhone(c.phone_number)}</p>

                  {/* Progress bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${hasReward ? 'bg-amber-400' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-light tabular-nums flex-shrink-0">
                      {c.progress}/{c.reward_threshold}
                    </span>
                  </div>
                </div>

                {/* Right side: visits + streak + last seen */}
                <div className="text-right flex-shrink-0 space-y-0.5">
                  <p className="text-xs text-text-light">
                    <span className="font-semibold text-text-dark">{c.total_visits}</span> visits
                  </p>
                  {c.streak_enabled && c.current_streak > 0 && (
                    <p className="text-xs text-orange-600 font-medium">
                      🔥 {c.current_streak}{periodLabel(c.streak_period)} streak
                    </p>
                  )}
                  <p className="text-xs text-text-light">{timeAgo(c.last_scan_at)}</p>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
