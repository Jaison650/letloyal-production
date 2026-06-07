import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  Users,
  TrendingUp,
  Gift,
  Star,
  Bell,
  ArrowRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import LiveClock from '@/components/merchant/LiveClock';
import { getMerchantFromCookies } from '@/lib/session';
import { query, queryOne } from '@/lib/db';

type PageProps = { params: Promise<{ slug: string }> };

// ── helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hrs   = Math.floor(mins / 60);
  const days  = Math.floor(hrs / 24);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hrs  < 24)  return `${hrs}h ago`;
  return `${days}d ago`;
}

function maskPhone(phone: string) {
  if (phone.length >= 10) return `${phone.slice(0, 3)}••••${phone.slice(-3)}`;
  return phone;
}

// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode; label: string; value: number | string; color: string;
}) {
  return (
    <div className={`card flex items-center gap-4 border-t-4 ${color}`}>
      <div className="p-2.5 rounded-xl bg-primary-light text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text-dark">{value}</p>
        <p className="text-xs font-medium text-text-light uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function MerchantDashboardPage({ params }: PageProps) {
  const { slug } = await params;

  // Auth
  await cookies(); // ensure cookie store is available
  const merchant = await getMerchantFromCookies();
  if (!merchant || merchant.slug !== slug) redirect('/merchant/login');

  const merchantId = merchant.id;

  // ── Fetch all dashboard data ─────────────────────────────────────────────
  const [statsRow, campaign, recentVisits, insightRows] = await Promise.all([

    queryOne<{
      scans_today:      number;
      active_customers: number;
      redeemed_week:    number;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM visits
          WHERE merchant_id = ? AND DATE(created_at) = CURDATE())        AS scans_today,
        (SELECT COUNT(DISTINCT customer_id) FROM customer_merchant
          WHERE merchant_id = ?)                                          AS active_customers,
        (SELECT COUNT(*) FROM redemptions
          WHERE merchant_id = ?
            AND redeemed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))           AS redeemed_week
    `, [merchantId, merchantId, merchantId]),

    queryOne<{
      id:                 string;
      name:               string;
      campaign_type:      string;
      reward_threshold:   number;
      reward_description: string;
      member_count:       number;
      redeemed_count:     number;
    }>(`
      SELECT
        c.id, c.name, c.campaign_type,
        c.reward_threshold, c.reward_description,
        COUNT(DISTINCT cm.customer_id)  AS member_count,
        (SELECT COUNT(*) FROM redemptions r WHERE r.campaign_id = c.id) AS redeemed_count
      FROM campaigns c
      LEFT JOIN customer_merchant cm ON cm.campaign_id = c.id
      WHERE c.merchant_id = ? AND c.status = 'active'
      GROUP BY c.id
      LIMIT 1
    `, [merchantId]),

    query<{
      customer_name:  string | null;
      phone_number:   string;
      points_added:   number;
      amount_rupees:  number | null;
      created_at:     string;
    }>(`
      SELECT
        cu.name         AS customer_name,
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
      JOIN customers cu ON cu.id  = cm.customer_id
      JOIN campaigns  c  ON c.id  = cm.campaign_id
      WHERE cm.merchant_id = ?
        AND c.status = 'active'
        AND (
          cm.reward_status = 'unlocked'
          OR (cm.reward_status = 'in_progress'
              AND c.reward_threshold > 0
              AND cm.progress / c.reward_threshold >= 0.75)
        )
      ORDER BY cm.reward_status DESC, cm.progress DESC
      LIMIT 10
    `, [merchantId]),
  ]);

  const stats = {
    scans_today:      statsRow?.scans_today      ?? 0,
    active_customers: statsRow?.active_customers ?? 0,
    redeemed_week:    statsRow?.redeemed_week    ?? 0,
  };

  const closeToReward   = insightRows.filter(r => r.type === 'close_to_reward');
  const pendingRedeems  = insightRows.filter(r => r.type === 'pending_redeem');

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <LiveClock businessName={merchant.business_name} />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<QrCode size={20} />}
          label="Scans Today"
          value={stats.scans_today}
          color="border-primary"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Active Customers"
          value={stats.active_customers}
          color="border-purple-400"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Visits Today"
          value={stats.scans_today}
          color="border-amber-400"
        />
        <StatCard
          icon={<Gift size={20} />}
          label="Redeemed This Week"
          value={stats.redeemed_week}
          color="border-emerald-400"
        />
      </div>

      {/* ── Generate QR — always-visible primary action ── */}
      <Link
        href={`/m/${slug}/qr`}
        className="flex items-center gap-4 bg-primary hover:bg-primary/90 transition-colors text-white rounded-2xl px-5 py-4 shadow-md"
      >
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <QrCode size={26} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg leading-tight">Generate QR Code</p>
          <p className="text-white/80 text-sm">Show QR to customer to earn stamps</p>
        </div>
        <ArrowRight size={20} className="text-white/70 flex-shrink-0" />
      </Link>

      {/* ── Middle Row: Campaign + Recent Transactions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Campaign card */}
        {campaign ? (
          <div
            className="card"
            style={{ background: 'linear-gradient(135deg, #1a2e2a 0%, #2d4a3e 100%)' }}
          >
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2">
              Running Campaign
            </p>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-bold text-white">{campaign.name}</h2>
              <span className="text-2xl font-bold text-white">{campaign.member_count}</span>
            </div>
            <p className="text-text-light text-sm mt-1 flex items-center gap-1">
              <Gift size={14} className="text-emerald-400" />
              {campaign.reward_description}
            </p>
            <p className="text-xs text-text-light mt-1">
              {campaign.campaign_type === 'spend_based'
                ? `₹${campaign.reward_threshold} spend to unlock`
                : `${campaign.reward_threshold} visits to unlock`}
            </p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-text-light">{campaign.member_count} members</span>
              <span className="text-xs text-emerald-400">{campaign.redeemed_count} redeemed</span>
            </div>
          </div>
        ) : (
          <div className="card flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border-light">
            <Star size={32} className="text-text-light mb-3" />
            <p className="text-text-medium font-medium">No active campaign</p>
            <p className="text-sm text-text-light mt-1 mb-4">Create one to start rewarding customers</p>
            <Link href={`/m/${slug}/campaign`} className="btn-primary text-sm px-4 py-2">
              Create Campaign
            </Link>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-dark">Recent Transactions</h2>
            <span className="text-xs text-text-light flex items-center gap-1">
              <Clock size={12} /> Updated just now
            </span>
          </div>

          {recentVisits.length === 0 ? (
            <div className="text-center py-8 text-text-light">
              <QrCode size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1">Show QR code to start scanning</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentVisits.map((v, i) => {
                const displayName = v.customer_name || maskPhone(v.phone_number);
                const isEarn = v.points_added > 0;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isEarn ? 'bg-green-50' : 'bg-red-50'}`}>
                      <TrendingUp size={14} className={isEarn ? 'text-green-600' : 'text-red-500 rotate-180'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-dark truncate">{displayName}</p>
                      <p className="text-xs text-text-light">{campaign?.name ?? 'Loyalty'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-semibold ${isEarn ? 'text-green-600' : 'text-red-500'}`}>
                        {isEarn ? '+' : ''}{v.points_added}
                        {campaign?.campaign_type === 'spend_based' ? 'pt' : ' visit'}
                      </p>
                      <p className="text-xs text-text-light">{timeAgo(v.created_at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Insights ── */}
      {(closeToReward.length > 0 || pendingRedeems.length > 0) && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-primary" />
            <h2 className="font-semibold text-text-dark">Customer Insights</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {pendingRedeems.length > 0 && (
              <Link href={`/m/${slug}/redeem`}>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer">
                  <Gift size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-amber-800">Rewards Waiting to Redeem</p>
                      <span className="text-xs font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">HIGH</span>
                    </div>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {pendingRedeems.length} customer{pendingRedeems.length > 1 ? 's' : ''} ha{pendingRedeems.length > 1 ? 've' : 's'} an unlocked reward waiting.
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                </div>
              </Link>
            )}

            {closeToReward.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-primary-light border border-primary/20">
                <Star size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-primary">Customers Close to Reward</p>
                    <span className="text-xs font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">HIGH</span>
                  </div>
                  <p className="text-xs text-text-medium mt-0.5">
                    {closeToReward.length} customer{closeToReward.length > 1 ? 's are' : ' is'} 75%+ of the way to unlocking their reward.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Customers',    href: `/m/${slug}/customers`,  icon: <Users size={18} /> },
          { label: 'Validate',     href: `/m/${slug}/validate`,   icon: <ShieldCheck size={18} /> },
          { label: 'Feedback',     href: `/m/${slug}/feedback`,   icon: <Star size={18} /> },
          { label: 'Campaign',     href: `/m/${slug}/campaign`,   icon: <Gift size={18} /> },
        ].map(({ label, href, icon }) => (
          <Link
            key={href}
            href={href}
            className="card flex flex-col items-center gap-2 py-5 hover:bg-primary-light hover:border-primary/20 transition-colors text-center group"
          >
            <span className="text-primary group-hover:scale-110 transition-transform">{icon}</span>
            <span className="text-sm font-medium text-text-medium group-hover:text-primary">{label}</span>
          </Link>
        ))}
      </div>

    </div>
  );
}
