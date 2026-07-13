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
import { maskPhone } from '@/lib/utils';
import { Badge, Card, EmptyState, Table, THead, TH, TBody, TR, TD } from '@/components/ds';

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

// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card padding="sm" className="flex items-center gap-4">
      <div className="p-2.5 rounded-xl bg-teal-subtle text-teal flex-shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-display font-bold text-ink [font-variant-numeric:tabular-nums]">{value}</p>
        <p className="text-label uppercase text-ink-faint">{label}</p>
      </div>
    </Card>
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
        />
        <StatCard
          icon={<Users size={20} />}
          label="Active Customers"
          value={stats.active_customers}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Visits Today"
          value={stats.scans_today}
        />
        <StatCard
          icon={<Gift size={20} />}
          label="Redeemed This Week"
          value={stats.redeemed_week}
        />
      </div>

      {/* ── Generate QR — always-visible primary action ── */}
      <Link
        href={`/m/${slug}/qr`}
        className="flex items-center gap-4 bg-teal hover:bg-teal-hover transition-colors text-teal-fg rounded-[16px] px-5 py-4 shadow-ds"
      >
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <QrCode size={26} />
        </div>
        <div className="flex-1">
          <p className="font-display font-bold text-lg leading-tight">Generate QR Code</p>
          <p className="opacity-80 text-body-sm">Show QR to customer to earn stamps</p>
        </div>
        <ArrowRight size={20} className="opacity-70 flex-shrink-0" />
      </Link>

      {/* ── Middle Row: Campaign + Recent Transactions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Campaign card */}
        {campaign ? (
          <div className="rounded-[16px] bg-section-dark p-5 shadow-ds">
            <p className="text-label uppercase text-[#9FE7CC] mb-2">Running Campaign</p>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-display font-bold text-white">{campaign.name}</h2>
              <span className="text-2xl font-display font-bold text-white [font-variant-numeric:tabular-nums]">{campaign.member_count}</span>
            </div>
            <p className="text-[#AEBDB5] text-body-sm mt-1 flex items-center gap-1">
              <Gift size={14} className="text-[#F2C230]" />
              {campaign.reward_description}
            </p>
            <p className="text-caption text-[#7C8C84] mt-1">
              {campaign.campaign_type === 'spend_based'
                ? `₹${campaign.reward_threshold} spend to unlock`
                : `${campaign.reward_threshold} visits to unlock`}
            </p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-caption text-[#7C8C84]">{campaign.member_count} members</span>
              <span className="text-caption text-[#F2C230] font-semibold">{campaign.redeemed_count} redeemed</span>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No active campaign"
            description="Create one to start rewarding customers"
            action={
              <Link href={`/m/${slug}/campaign`} className="inline-flex items-center rounded-full bg-teal text-teal-fg font-bold text-body-sm px-5 py-2.5 hover:bg-teal-hover transition-colors">
                Create Campaign
              </Link>
            }
          />
        )}

        {/* Recent Transactions */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-h4 text-ink">Recent Transactions</h2>
            <span className="text-caption text-ink-faint flex items-center gap-1">
              <Clock size={12} /> Updated just now
            </span>
          </div>

          {recentVisits.length === 0 ? (
            <div className="text-center py-8 text-ink-faint">
              <QrCode size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-body-sm">No transactions yet</p>
              <p className="text-caption mt-1">Show QR code to start scanning</p>
            </div>
          ) : (
            <Table density="compact">
              <THead>
                <TR><TH>Customer</TH><TH>Points</TH><TH>When</TH></TR>
              </THead>
              <TBody>
                {recentVisits.map((v, i) => {
                  const displayName = v.customer_name || maskPhone(v.phone_number);
                  const isEarn = v.points_added > 0;
                  return (
                    <TR key={i}>
                      <TD className="font-semibold text-ink">{displayName}</TD>
                      <TD className={isEarn ? 'text-good font-bold' : 'text-bad font-bold'}>
                        {isEarn ? '+' : ''}{v.points_added}
                        {campaign?.campaign_type === 'spend_based' ? 'pt' : ' visit'}
                      </TD>
                      <TD className="text-ink-faint">{timeAgo(v.created_at)}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>
      </div>

      {/* ── Insights ── */}
      {(closeToReward.length > 0 || pendingRedeems.length > 0) && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-teal" />
            <h2 className="font-display font-bold text-h4 text-ink">Customer Insights</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingRedeems.length > 0 && (
              <Link href={`/m/${slug}/redeem`}>
                <div className="flex items-start gap-3 p-3 rounded-[11px] bg-reward-subtle border border-reward/40 hover:brightness-[0.98] transition-[filter] cursor-pointer">
                  <Gift size={20} className="text-reward-deep mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-body-sm font-bold text-reward-deep">Rewards Waiting to Redeem</p>
                      <Badge intent="reward" dot={false}>HIGH</Badge>
                    </div>
                    <p className="text-caption text-ink-sub mt-0.5">
                      {pendingRedeems.length} customer{pendingRedeems.length > 1 ? 's' : ''} ha{pendingRedeems.length > 1 ? 've' : 's'} an unlocked reward waiting.
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-reward-deep mt-0.5 flex-shrink-0" />
                </div>
              </Link>
            )}

            {closeToReward.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-[11px] bg-teal-subtle border border-teal/20">
                <Star size={20} className="text-teal mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-body-sm font-bold text-teal">Customers Close to Reward</p>
                    <Badge intent="teal" dot={false}>HIGH</Badge>
                  </div>
                  <p className="text-caption text-ink-sub mt-0.5">
                    {closeToReward.length} customer{closeToReward.length > 1 ? 's are' : ' is'} 75%+ of the way to unlocking their reward.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Customers', href: `/m/${slug}/customers`, icon: <Users size={18} /> },
          { label: 'Validate',  href: `/m/${slug}/validate`,  icon: <ShieldCheck size={18} /> },
          { label: 'Feedback',  href: `/m/${slug}/feedback`,  icon: <Star size={18} /> },
          { label: 'Campaign',  href: `/m/${slug}/campaign`,  icon: <Gift size={18} /> },
        ].map(({ label, href, icon }) => (
          <Link
            key={href}
            href={href}
            className="rounded-[16px] border border-stroke bg-surface-1 shadow-ds flex flex-col items-center gap-2 py-5 hover:bg-teal-subtle hover:border-teal/20 transition-colors text-center group"
          >
            <span className="text-teal group-hover:scale-110 transition-transform">{icon}</span>
            <span className="text-body-sm font-semibold text-ink-sub group-hover:text-teal">{label}</span>
          </Link>
        ))}
      </div>

    </div>
  );
}
