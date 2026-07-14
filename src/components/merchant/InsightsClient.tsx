'use client';

import { useState, useEffect } from 'react';
import {
  BarChart2, Users, TrendingUp, Bell, Crown, Gift, Clock,
  Send, CheckCircle, AlertCircle, RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { WhatsAppButton } from '@/components/merchant/WhatsAppButton';
import { Badge, Button, Card, Input, Textarea } from '@/components/ds';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Stats {
  totalCustomers: number; visitsThisWeek: number; visitsThisMonth: number;
  totalVisits: number; redemptions: number; avgVisitsPerCustomer: number;
}
interface TrendPoint  { date: string; count: number; }
interface PeakDay     { day: string; count: number; }
interface Segments    { new: number; regular: number; loyal: number; atRisk: number; }
interface TopCustomer { name: string | null; phone: string; visit_count: number; last_visit: string; }
interface GenderStat  { label: string; count: number; pct: number; }
interface AgeGroup    { label: string; count: number; pct: number; }
interface Birthday    { display_name: string; masked_phone: string; days_until: number; days_label: string; }
interface Customer    {
  customer_id: string; name: string | null; phone_number: string;
  progress: number; reward_threshold: number; reward_status: string;
  total_visits: number; last_scan_at: string | null;
  current_streak: number; streak_period: string; streak_enabled: number;
}
interface Blast { id: string; title: string; body: string; recipient_count: number; sent_at: string; }

interface Props {
  slug: string; merchantId: string; vapidPublicKey: string;
  stats: Stats; trend30: TrendPoint[]; peakDays: PeakDay[]; segments: Segments;
  topCustomers: TopCustomer[]; genderStats: GenderStat[]; ageGroups: AgeGroup[];
  noAgeCount: number; upcomingBirthdays: Birthday[]; customers: Customer[];
  blasts: Blast[]; customerSubCount: number;
  blastsUsed: number; blastLimit: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(d: string | null) {
  if (!d) return 'Never';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), days = Math.floor(h / 24);
  if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`; if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
const GENDER_LABEL: Record<string, string> = {
  male: 'Male', female: 'Female', other: 'Other', not_shared: 'Not shared', prefer_not_to_say: 'Prefer not to say',
};
const GENDER_COLOR: Record<string, string> = {
  male: 'bg-teal', female: 'bg-note', other: 'bg-reward', not_shared: 'bg-stroke-strong', prefer_not_to_say: 'bg-stroke-strong',
};
const AGE_LABEL: Record<string, string> = { under_18: 'Under 18', '18-24': '18–24', '25-34': '25–34', '35-44': '35–44', '45+': '45+' };

// ── Bar Row ───────────────────────────────────────────────────────────────────
function BarRow({ label, pct, count, color }: { label: string; pct: number; count: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-sm font-bold text-ink">{pct}% <span className="text-xs text-ink-faint font-normal">({count})</span></span>
      </div>
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Trend Chart (SVG sparkline) ───────────────────────────────────────────────
function TrendChart({ data }: { data: TrendPoint[] }) {
  const max   = Math.max(...data.map(d => d.count), 1);
  const W     = 600; const H = 80; const pad = 4;
  const pts   = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((d.count / max) * (H - pad * 2));
    return `${x},${y}`;
  });
  const area  = `M${pts[0]} L${pts.slice(1).join(' L')} L${W - pad},${H} L${pad},${H} Z`;
  const line  = `M${pts[0]} L${pts.slice(1).join(' L')}`;

  // Show labels for first, middle, last
  const labelIdx = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" preserveAspectRatio="none" style={{ height: 100 }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-default)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent-default)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#trendGrad)" />
        <path d={line} fill="none" stroke="var(--accent-default)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => d.count > 0 && (
          <circle key={i} cx={pts[i].split(',')[0]} cy={pts[i].split(',')[1]}
            r="3" fill="var(--accent-default)" />
        ))}
        {labelIdx.map(i => (
          <text key={i}
            x={pts[i].split(',')[0]} y={H + 14}
            textAnchor="middle" fontSize="9" fill="var(--text-tertiary)"
          >
            {new Date(data[i].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── Peak Days Chart ───────────────────────────────────────────────────────────
function PeakDaysChart({ data }: { data: PeakDay[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-20 pt-2">
      {data.map(d => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-ink-faint tabular-nums">{d.count || ''}</span>
          <div className="w-full rounded-t-sm bg-teal/20 relative overflow-hidden" style={{ height: 48 }}>
            <div
              className="absolute bottom-0 w-full bg-teal rounded-t-sm transition-all"
              style={{ height: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-ink-faint font-medium">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

// ── Push Manager ─────────────────────────────────────────────────────────────
function usePushManager(merchantId: string, vapidPublicKey: string) {
  const [supported,   setSupported]   = useState(false);
  const [permission,  setPermission]  = useState<NotificationPermission>('default');
  const [subscribed,  setSubscribed]  = useState(false);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    setSupported(true);
    setPermission(Notification.permission);
    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    }).catch(() => {});
  }, []);

  async function subscribe() {
    setLoading(true);
    try {
      const reg  = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          type: 'merchant', ownerId: merchantId,
          subscription: { endpoint: sub.endpoint, keys: { p256dh: arrayBufferToBase64(sub.getKey('p256dh')!), auth: arrayBufferToBase64(sub.getKey('auth')!) } },
        }),
      });
      setSubscribed(true);
    } finally { setLoading(false); }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally { setLoading(false); }
  }

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
}
function arrayBufferToBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function InsightsClient({
  slug, merchantId, vapidPublicKey,
  stats, trend30, peakDays, segments,
  topCustomers, genderStats, ageGroups, noAgeCount, upcomingBirthdays,
  customers, blasts: initialBlasts, customerSubCount: initialSubCount,
  blastsUsed: initialBlastsUsed, blastLimit,
}: Props) {
  const [tab, setTab] = useState<'overview' | 'customers' | 'notifications'>('overview');
  const push = usePushManager(merchantId, vapidPublicKey);

  // Blast form
  const [blastTitle,   setBlastTitle]   = useState('');
  const [blastBody,    setBlastBody]    = useState('');
  const [blasting,     setBlasting]     = useState(false);
  const [blastError,   setBlastError]   = useState('');
  const [blastSuccess, setBlastSuccess] = useState('');
  const [blasts,       setBlasts]       = useState(initialBlasts);
  const [subCount,     setSubCount]     = useState(initialSubCount);
  const [blastsUsed,   setBlastsUsed]   = useState(initialBlastsUsed);

  // Customer push subscribe (for customer opt-in from merchant page — not used here, but reuses the same SW)
  async function sendBlast() {
    if (!blastTitle.trim() || !blastBody.trim()) { setBlastError('Both title and message are required.'); return; }
    setBlastError(''); setBlastSuccess(''); setBlasting(true);
    try {
      const res  = await fetch(`/api/merchant/${slug}/push`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: blastTitle.trim(), body: blastBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setBlastError(data.error || 'Failed.'); return; }
      setBlastSuccess(`Sent to ${data.sent} subscriber${data.sent !== 1 ? 's' : ''}!`);
      if (data.blasts_used != null) setBlastsUsed(data.blasts_used);
      setBlastTitle(''); setBlastBody('');
      // Refresh blasts list
      const fresh = await fetch(`/api/merchant/${slug}/push`).then(r => r.json());
      if (fresh.blasts) { setBlasts(fresh.blasts); setSubCount(fresh.subscriber_count); }
      if (fresh.blasts_used != null) setBlastsUsed(fresh.blasts_used);
    } finally { setBlasting(false); }
  }

  const TABS = [
    { id: 'overview',       label: 'Overview',       icon: <BarChart2 size={15} /> },
    { id: 'customers',      label: 'Customers',      icon: <Users size={15} /> },
    { id: 'notifications',  label: 'Notifications',  icon: <Bell size={15} /> },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Insights</h1>
        <p className="text-sm text-ink-faint mt-0.5">Analytics, customers, and push notifications</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface-2 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all',
              tab === t.id ? 'bg-surface-1 text-teal shadow-sm' : 'text-ink-sub hover:text-ink',
            )}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-5">

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Customers',    value: stats.totalCustomers,       icon: <Users size={16} />      },
              { label: 'Visits This Week',   value: stats.visitsThisWeek,       icon: <Clock size={16} />      },
              { label: 'Visits This Month',  value: stats.visitsThisMonth,      icon: <TrendingUp size={16} /> },
              { label: 'Total Visits',       value: stats.totalVisits,          icon: <BarChart2 size={16} />  },
              { label: 'Avg Visits / Customer',value: stats.avgVisitsPerCustomer,icon:<TrendingUp size={16}/>  },
              { label: 'Rewards Redeemed',   value: stats.redemptions,          icon: <Gift size={16} />       },
            ].map(s => (
              <Card key={s.label} padding="sm" className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-subtle text-teal flex-shrink-0">{s.icon}</div>
                <div>
                  <p className="text-2xl font-display font-bold text-ink [font-variant-numeric:tabular-nums]">{s.value}</p>
                  <p className="text-label uppercase text-ink-faint">{s.label}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* 30-day trend */}
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-teal" />
              <h2 className="font-semibold text-ink">Visits — Last 30 Days</h2>
            </div>
            {trend30.every(d => d.count === 0) ? (
              <p className="text-sm text-ink-faint py-6 text-center">No visits yet in the last 30 days.</p>
            ) : (
              <TrendChart data={trend30} />
            )}
          </Card>

          {/* Peak days + Segments side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Peak days */}
            <Card padding="md">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 size={16} className="text-teal" />
                <h2 className="font-semibold text-ink">Busiest Days</h2>
              </div>
              <p className="text-xs text-ink-faint mb-3">All-time visits by day of week</p>
              {peakDays.length === 0 ? (
                <p className="text-sm text-ink-faint py-4 text-center">No data yet.</p>
              ) : (
                <PeakDaysChart data={peakDays} />
              )}
            </Card>

            {/* Customer segments */}
            <Card padding="md">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-teal" />
                <h2 className="font-semibold text-ink">Customer Segments</h2>
              </div>
              <p className="text-xs text-ink-faint mb-3">Based on visit frequency</p>
              <div className="space-y-2.5">
                {[
                  { label: '🆕 New',     desc: '1 visit',        value: segments.new,     color: 'bg-note'   },
                  { label: '🔄 Regular', desc: '2–9 visits',     value: segments.regular, color: 'bg-teal'    },
                  { label: '⭐ Loyal',   desc: '10+ visits',     value: segments.loyal,   color: 'bg-reward'  },
                  { label: '⚠️ At-Risk', desc: 'Inactive 30d+',  value: segments.atRisk,  color: 'bg-warn'   },
                ].map(s => {
                  const total = segments.new + segments.regular + segments.loyal;
                  const pct   = total > 0 ? Math.round((s.value / total) * 100) : 0;
                  return (
                    <div key={s.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-ink">{s.label} <span className="text-ink-faint font-normal">— {s.desc}</span></span>
                        <span className="font-semibold text-ink">{s.value}</span>
                      </div>
                      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-ink-faint mt-3">
                💡 At-risk customers haven&apos;t visited in 30+ days — consider a push blast to bring them back.
              </p>
            </Card>
          </div>

          {/* Top customers */}
          {topCustomers.length > 0 && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <Crown size={16} className="text-reward" />
                <h2 className="font-semibold text-ink">Top Customers</h2>
              </div>
              <div className="space-y-2">
                {topCustomers.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      i === 0 ? 'bg-reward-subtle text-reward-deep' : 'bg-surface-2 text-ink-sub')}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{c.name ?? 'Unknown'}</p>
                      <p className="text-xs text-ink-faint">{c.phone}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-ink">{c.visit_count}</p>
                      <p className="text-xs text-ink-faint">visits</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── CUSTOMERS TAB ───────────────────────────────────────────── */}
      {tab === 'customers' && (
        <div className="space-y-5">

          {/* Demographics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card padding="md">
              <div className="flex items-center gap-2 mb-4"><Users size={16} className="text-teal" /><h2 className="font-semibold text-ink">Gender Split</h2></div>
              {genderStats.length === 0
                ? <p className="text-sm text-ink-faint py-4 text-center">No gender data yet.</p>
                : genderStats.map(s => <BarRow key={s.label} label={GENDER_LABEL[s.label] ?? s.label} pct={s.pct} count={s.count} color={GENDER_COLOR[s.label] ?? 'bg-stroke-strong'} />)
              }
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={16} className="text-teal" /><h2 className="font-semibold text-ink">Age Groups</h2></div>
              {ageGroups.length === 0
                ? <p className="text-sm text-ink-faint py-4 text-center">No age data yet.</p>
                : (<>
                    {ageGroups.map(g => <BarRow key={g.label} label={AGE_LABEL[g.label] ?? g.label} pct={g.pct} count={g.count} color="bg-reward" />)}
                    <p className="text-xs text-ink-faint mt-2">{noAgeCount} customers haven&apos;t shared birthday</p>
                  </>)
              }
            </Card>
          </div>

          {/* Upcoming birthdays */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-teal" />
                <h2 className="font-semibold text-ink">Upcoming Birthdays</h2>
                <Badge intent="reward">Next 30 days</Badge>
              </div>
            </div>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-ink-faint py-6 text-center">No upcoming birthdays in the next 30 days.</p>
            ) : (
              <div className="space-y-3">
                {upcomingBirthdays.map((b, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${b.days_until <= 1 ? 'bg-reward-subtle border-reward/40' : 'bg-surface-1 border-stroke'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${b.days_until <= 1 ? 'bg-reward-subtle' : 'bg-teal-subtle'}`}>🎂</div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{b.display_name}</p>
                        <p className="text-xs text-ink-faint">{b.masked_phone} · <strong className={b.days_until <= 1 ? 'text-reward-deep' : 'text-ink-sub'}>{b.days_label}</strong></p>
                      </div>
                    </div>
                    <WhatsAppButton />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 p-3 bg-teal-subtle rounded-xl border border-teal/20">
              <p className="text-xs text-teal">📌 Only first name and masked phone shown. Birthday date is never displayed.</p>
            </div>
          </Card>

          {/* Full customer list */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-4 py-3 border-b border-stroke flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-teal" />
                <h2 className="font-semibold text-ink">All Customers</h2>
              </div>
              <span className="text-xs text-ink-faint">{customers.length} total</span>
            </div>
            {customers.length === 0 ? (
              <p className="text-sm text-ink-faint py-10 text-center">No customers yet.</p>
            ) : (
              <div className="divide-y divide-stroke">
                {customers.map(c => {
                  const pct = Math.min(100, Math.round((c.progress / c.reward_threshold) * 100));
                  const hasReward = c.reward_status === 'unlocked';
                  const period = c.streak_period ?? 'day';
                  const pl = period === 'week' ? 'wk' : period === 'month' ? 'mo' : 'd';
                  return (
                    <div key={c.customer_id} className="px-4 py-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-subtle flex items-center justify-center flex-shrink-0 relative">
                        <span className="text-sm font-bold text-teal">{(c.name ?? c.phone_number).charAt(0).toUpperCase()}</span>
                        {hasReward && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-reward flex items-center justify-center"><Crown size={9} className="text-reward-fg" /></span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-ink truncate">{c.name ?? 'Unknown'}</p>
                          {hasReward && <Badge intent="reward" className="flex-shrink-0">Reward ready</Badge>}
                        </div>
                        <p className="text-xs text-ink-faint">{c.phone_number.replace(/(\+91)(\d{3})(\d{3})(\d{4})/, '+91 $2•••$4')}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${hasReward ? 'bg-reward' : 'bg-teal'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-ink-faint tabular-nums flex-shrink-0">{c.progress}/{c.reward_threshold}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-0.5">
                        <p className="text-xs text-ink-faint"><span className="font-semibold text-ink">{c.total_visits}</span> visits</p>
                        {c.streak_enabled && c.current_streak > 0 && <p className="text-xs text-reward font-medium">🔥 {c.current_streak}{pl}</p>}
                        <p className="text-xs text-ink-faint">{timeAgo(c.last_scan_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ───────────────────────────────────────── */}
      {tab === 'notifications' && (
        <div className="space-y-5">

          {/* Merchant alerts toggle */}
          <Card padding="md">
            <div className="flex items-center gap-2 mb-1">
              <Bell size={16} className="text-teal" />
              <h2 className="font-semibold text-ink">My Alerts</h2>
            </div>
            <p className="text-xs text-ink-faint mb-4">Get notified on this browser when a new customer scans or a reward is redeemed.</p>

            {!push.supported ? (
              <p className="text-sm text-bad">Push notifications are not supported in this browser.</p>
            ) : push.permission === 'denied' ? (
              <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-sm text-bad">
                Notifications are blocked. Please allow them in your browser settings and reload.
              </div>
            ) : push.subscribed ? (
              <div className="flex items-center justify-between p-3 rounded-[11px] bg-good-subtle">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-good" />
                  <span className="text-sm font-medium text-good">Alerts enabled on this browser</span>
                </div>
                <button onClick={push.unsubscribe} disabled={push.loading}
                  className="text-xs text-bad hover:text-bad/70 font-medium disabled:opacity-50">
                  {push.loading ? 'Disabling…' : 'Disable'}
                </button>
              </div>
            ) : (
              <Button onClick={push.subscribe} disabled={push.loading} size="sm" className="disabled:opacity-50">
                <Bell size={14} />
                {push.loading ? 'Enabling…' : 'Enable Alerts for This Browser'}
              </Button>
            )}
          </Card>

          {/* Send blast to customers */}
          <Card padding="md">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-teal" />
                <h2 className="font-semibold text-ink">Send to Customers</h2>
              </div>
              {/* Quota badge */}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                blastsUsed >= blastLimit
                  ? 'bg-bad-subtle text-bad'
                  : blastsUsed >= blastLimit - 1
                  ? 'bg-warn-subtle text-warn'
                  : 'bg-good-subtle text-good'
              }`}>
                {blastsUsed}/{blastLimit} this month
              </span>
            </div>
            <p className="text-xs text-ink-faint mb-4">
              Push a message to all customers who opted in when scanning.
              <span className="font-semibold text-ink"> {subCount} subscriber{subCount !== 1 ? 's' : ''}</span> currently opted in.
            </p>

            {blastsUsed >= blastLimit ? (
              <div className="rounded-[11px] bg-bad-subtle px-4 py-3">
                <p className="text-sm text-bad font-medium">Monthly blast limit reached</p>
                <p className="text-xs text-bad mt-1">You&apos;ve used all {blastLimit} blasts for this rolling 30-day period. Available again as older blasts roll off.</p>
              </div>
            ) : subCount === 0 ? (
              <div className="rounded-[11px] bg-warn-subtle px-4 py-3">
                <p className="text-sm text-warn font-medium">No customer subscribers yet</p>
                <p className="text-xs text-warn mt-1">Customers can opt in to notifications after scanning your QR code.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-body-sm font-semibold text-ink mb-1.5">Title <span className="text-ink-faint font-normal">(max 80 chars)</span></label>
                  <Input
                    className="mt-1"
                    value={blastTitle}
                    onChange={e => setBlastTitle(e.target.value)}
                    placeholder="e.g. Double points this weekend! 🎉"
                    maxLength={80}
                  />
                  <p className="text-xs text-ink-faint text-right mt-1">{blastTitle.length}/80</p>
                </div>
                <div>
                  <label className="block text-body-sm font-semibold text-ink mb-1.5">Message <span className="text-ink-faint font-normal">(max 200 chars)</span></label>
                  <Textarea
                    className="mt-1 resize-none"
                    rows={3}
                    value={blastBody}
                    onChange={e => setBlastBody(e.target.value)}
                    placeholder="e.g. Come visit us Sat–Sun and earn 2× loyalty points. Don&apos;t miss out!"
                    maxLength={200}
                  />
                  <p className="text-xs text-ink-faint text-right mt-1">{blastBody.length}/200</p>
                </div>
                {blastError   && <p className="text-xs text-bad flex items-center gap-1"><AlertCircle size={12} /> {blastError}</p>}
                {blastSuccess && <p className="text-xs text-good flex items-center gap-1"><CheckCircle size={12} /> {blastSuccess}</p>}
                <Button
                  onClick={sendBlast}
                  disabled={blasting || !blastTitle.trim() || !blastBody.trim()}
                  fullWidth
                  className="justify-center"
                >
                  <Send size={14} />
                  {blasting ? 'Sending…' : `Send to ${subCount} Customer${subCount !== 1 ? 's' : ''}`}
                </Button>
                <p className="text-xs text-ink-faint text-center">{blastLimit - blastsUsed} blast{blastLimit - blastsUsed !== 1 ? 's' : ''} remaining this month</p>
              </div>
            )}
          </Card>

          {/* Blast history */}
          {blasts.length > 0 && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw size={16} className="text-teal" />
                <h2 className="font-semibold text-ink">Recent Blasts</h2>
              </div>
              <div className="space-y-2">
                {blasts.map(b => (
                  <div key={b.id} className="rounded-xl bg-surface-2 border border-stroke px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{b.title}</p>
                        <p className="text-xs text-ink-sub mt-0.5 line-clamp-2">{b.body}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-teal">{b.recipient_count} sent</p>
                        <p className="text-xs text-ink-faint">{timeAgo(b.sent_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
