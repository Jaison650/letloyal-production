'use client';

import { useState, useEffect } from 'react';
import {
  BarChart2, Users, TrendingUp, Bell, Crown, Gift, Clock,
  Send, CheckCircle, AlertCircle, RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { WhatsAppButton } from '@/components/merchant/WhatsAppButton';

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
  male: 'bg-primary', female: 'bg-purple-400', other: 'bg-amber-400', not_shared: 'bg-gray-300', prefer_not_to_say: 'bg-gray-300',
};
const AGE_LABEL: Record<string, string> = { under_18: 'Under 18', '18-24': '18–24', '25-34': '25–34', '35-44': '35–44', '45+': '45+' };

// ── Bar Row ───────────────────────────────────────────────────────────────────
function BarRow({ label, pct, count, color }: { label: string; pct: number; count: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-text-dark">{label}</span>
        <span className="text-sm font-bold text-text-dark">{pct}% <span className="text-xs text-text-light font-normal">({count})</span></span>
      </div>
      <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
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
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#trendGrad)" />
        <path d={line} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => d.count > 0 && (
          <circle key={i} cx={pts[i].split(',')[0]} cy={pts[i].split(',')[1]}
            r="3" fill="#0d9488" />
        ))}
        {labelIdx.map(i => (
          <text key={i}
            x={pts[i].split(',')[0]} y={H + 14}
            textAnchor="middle" fontSize="9" fill="#94a3b8"
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
          <span className="text-xs text-text-light tabular-nums">{d.count || ''}</span>
          <div className="w-full rounded-t-sm bg-primary/20 relative overflow-hidden" style={{ height: 48 }}>
            <div
              className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all"
              style={{ height: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-text-light font-medium">{d.day}</span>
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
      setBlastTitle(''); setBlastBody('');
      // Refresh blasts list
      const fresh = await fetch(`/api/merchant/${slug}/push`).then(r => r.json());
      if (fresh.blasts) { setBlasts(fresh.blasts); setSubCount(fresh.subscriber_count); }
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
        <h1 className="text-xl font-bold text-text-dark">Insights</h1>
        <p className="text-sm text-text-light mt-0.5">Analytics, customers, and push notifications</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-bg-muted rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all',
              tab === t.id ? 'bg-white text-primary shadow-sm' : 'text-text-medium hover:text-text-dark',
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
              { label: 'Total Customers',    value: stats.totalCustomers,       icon: <Users size={16} />,     color: 'text-primary'     },
              { label: 'Visits This Week',   value: stats.visitsThisWeek,       icon: <Clock size={16} />,     color: 'text-green-600'   },
              { label: 'Visits This Month',  value: stats.visitsThisMonth,      icon: <TrendingUp size={16} />,color: 'text-blue-600'    },
              { label: 'Total Visits',       value: stats.totalVisits,          icon: <BarChart2 size={16} />, color: 'text-indigo-600'  },
              { label: 'Avg Visits / Customer',value: stats.avgVisitsPerCustomer,icon:<TrendingUp size={16}/>, color: 'text-amber-600'   },
              { label: 'Rewards Redeemed',   value: stats.redemptions,          icon: <Gift size={16} />,      color: 'text-rose-500'    },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-border-light px-4 py-3">
                <div className={`flex items-center gap-1.5 text-xs font-medium mb-1 ${s.color}`}>{s.icon} {s.label}</div>
                <p className="text-2xl font-bold text-text-dark">{s.value}</p>
              </div>
            ))}
          </div>

          {/* 30-day trend */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-primary" />
              <h2 className="font-semibold text-text-dark">Visits — Last 30 Days</h2>
            </div>
            {trend30.every(d => d.count === 0) ? (
              <p className="text-sm text-text-light py-6 text-center">No visits yet in the last 30 days.</p>
            ) : (
              <TrendChart data={trend30} />
            )}
          </div>

          {/* Peak days + Segments side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Peak days */}
            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 size={16} className="text-primary" />
                <h2 className="font-semibold text-text-dark">Busiest Days</h2>
              </div>
              <p className="text-xs text-text-light mb-3">All-time visits by day of week</p>
              {peakDays.length === 0 ? (
                <p className="text-sm text-text-light py-4 text-center">No data yet.</p>
              ) : (
                <PeakDaysChart data={peakDays} />
              )}
            </div>

            {/* Customer segments */}
            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-primary" />
                <h2 className="font-semibold text-text-dark">Customer Segments</h2>
              </div>
              <p className="text-xs text-text-light mb-3">Based on visit frequency</p>
              <div className="space-y-2.5">
                {[
                  { label: '🆕 New',     desc: '1 visit',        value: segments.new,     color: 'bg-blue-400'   },
                  { label: '🔄 Regular', desc: '2–9 visits',     value: segments.regular, color: 'bg-primary'    },
                  { label: '⭐ Loyal',   desc: '10+ visits',     value: segments.loyal,   color: 'bg-amber-400'  },
                  { label: '⚠️ At-Risk', desc: 'Inactive 30d+',  value: segments.atRisk,  color: 'bg-rose-400'   },
                ].map(s => {
                  const total = segments.new + segments.regular + segments.loyal;
                  const pct   = total > 0 ? Math.round((s.value / total) * 100) : 0;
                  return (
                    <div key={s.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-text-dark">{s.label} <span className="text-text-light font-normal">— {s.desc}</span></span>
                        <span className="font-semibold text-text-dark">{s.value}</span>
                      </div>
                      <div className="h-1.5 bg-bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-text-light mt-3">
                💡 At-risk customers haven&apos;t visited in 30+ days — consider a push blast to bring them back.
              </p>
            </div>
          </div>

          {/* Top customers */}
          {topCustomers.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Crown size={16} className="text-amber-500" />
                <h2 className="font-semibold text-text-dark">Top Customers</h2>
              </div>
              <div className="space-y-2">
                {topCustomers.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600')}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-dark truncate">{c.name ?? 'Unknown'}</p>
                      <p className="text-xs text-text-light">{c.phone}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-text-dark">{c.visit_count}</p>
                      <p className="text-xs text-text-light">visits</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CUSTOMERS TAB ───────────────────────────────────────────── */}
      {tab === 'customers' && (
        <div className="space-y-5">

          {/* Demographics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-4"><Users size={16} className="text-primary" /><h2 className="font-semibold text-text-dark">Gender Split</h2></div>
              {genderStats.length === 0
                ? <p className="text-sm text-text-light py-4 text-center">No gender data yet.</p>
                : genderStats.map(s => <BarRow key={s.label} label={GENDER_LABEL[s.label] ?? s.label} pct={s.pct} count={s.count} color={GENDER_COLOR[s.label] ?? 'bg-gray-300'} />)
              }
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={16} className="text-primary" /><h2 className="font-semibold text-text-dark">Age Groups</h2></div>
              {ageGroups.length === 0
                ? <p className="text-sm text-text-light py-4 text-center">No age data yet.</p>
                : (<>
                    {ageGroups.map(g => <BarRow key={g.label} label={AGE_LABEL[g.label] ?? g.label} pct={g.pct} count={g.count} color="bg-amber-400" />)}
                    <p className="text-xs text-text-light mt-2">{noAgeCount} customers haven&apos;t shared birthday</p>
                  </>)
              }
            </div>
          </div>

          {/* Upcoming birthdays */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-primary" />
                <h2 className="font-semibold text-text-dark">Upcoming Birthdays</h2>
                <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Next 30 days</span>
              </div>
            </div>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-text-light py-6 text-center">No upcoming birthdays in the next 30 days.</p>
            ) : (
              <div className="space-y-3">
                {upcomingBirthdays.map((b, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${b.days_until <= 1 ? 'bg-amber-50 border-amber-200' : 'bg-surface border-border-light'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${b.days_until <= 1 ? 'bg-amber-100' : 'bg-primary-light'}`}>🎂</div>
                      <div>
                        <p className="text-sm font-semibold text-text-dark">{b.display_name}</p>
                        <p className="text-xs text-text-light">{b.masked_phone} · <strong className={b.days_until <= 1 ? 'text-amber-700' : 'text-text-medium'}>{b.days_label}</strong></p>
                      </div>
                    </div>
                    <WhatsAppButton />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 p-3 bg-primary-light rounded-xl border border-primary/20">
              <p className="text-xs text-primary">📌 Only first name and masked phone shown. Birthday date is never displayed.</p>
            </div>
          </div>

          {/* Full customer list */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border-light flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-primary" />
                <h2 className="font-semibold text-text-dark">All Customers</h2>
              </div>
              <span className="text-xs text-text-light">{customers.length} total</span>
            </div>
            {customers.length === 0 ? (
              <p className="text-sm text-text-light py-10 text-center">No customers yet.</p>
            ) : (
              <div className="divide-y divide-border-light">
                {customers.map(c => {
                  const pct = Math.min(100, Math.round((c.progress / c.reward_threshold) * 100));
                  const hasReward = c.reward_status === 'unlocked';
                  const period = c.streak_period ?? 'day';
                  const pl = period === 'week' ? 'wk' : period === 'month' ? 'mo' : 'd';
                  return (
                    <div key={c.customer_id} className="px-4 py-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0 relative">
                        <span className="text-sm font-bold text-primary">{(c.name ?? c.phone_number).charAt(0).toUpperCase()}</span>
                        {hasReward && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center"><Crown size={9} className="text-white" /></span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-text-dark truncate">{c.name ?? 'Unknown'}</p>
                          {hasReward && <span className="text-xs bg-amber-100 text-amber-700 font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">Reward ready</span>}
                        </div>
                        <p className="text-xs text-text-light">{c.phone_number.replace(/(\+91)(\d{3})(\d{3})(\d{4})/, '+91 $2•••$4')}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${hasReward ? 'bg-amber-400' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-text-light tabular-nums flex-shrink-0">{c.progress}/{c.reward_threshold}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-0.5">
                        <p className="text-xs text-text-light"><span className="font-semibold text-text-dark">{c.total_visits}</span> visits</p>
                        {c.streak_enabled && c.current_streak > 0 && <p className="text-xs text-orange-600 font-medium">🔥 {c.current_streak}{pl}</p>}
                        <p className="text-xs text-text-light">{timeAgo(c.last_scan_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ───────────────────────────────────────── */}
      {tab === 'notifications' && (
        <div className="space-y-5">

          {/* Merchant alerts toggle */}
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <Bell size={16} className="text-primary" />
              <h2 className="font-semibold text-text-dark">My Alerts</h2>
            </div>
            <p className="text-xs text-text-light mb-4">Get notified on this browser when a new customer scans or a reward is redeemed.</p>

            {!push.supported ? (
              <p className="text-sm text-status-error">Push notifications are not supported in this browser.</p>
            ) : push.permission === 'denied' ? (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error">
                Notifications are blocked. Please allow them in your browser settings and reload.
              </div>
            ) : push.subscribed ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm font-medium text-green-800">Alerts enabled on this browser</span>
                </div>
                <button onClick={push.unsubscribe} disabled={push.loading}
                  className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50">
                  {push.loading ? 'Disabling…' : 'Disable'}
                </button>
              </div>
            ) : (
              <button onClick={push.subscribe} disabled={push.loading}
                className="btn-primary text-sm py-2.5 flex items-center gap-2 disabled:opacity-50">
                <Bell size={14} />
                {push.loading ? 'Enabling…' : 'Enable Alerts for This Browser'}
              </button>
            )}
          </div>

          {/* Send blast to customers */}
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <Send size={16} className="text-primary" />
              <h2 className="font-semibold text-text-dark">Send to Customers</h2>
            </div>
            <p className="text-xs text-text-light mb-4">
              Push a message to all customers who opted in when scanning.
              <span className="font-semibold text-text-dark"> {subCount} subscriber{subCount !== 1 ? 's' : ''}</span> currently opted in.
            </p>

            {subCount === 0 ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-sm text-amber-800 font-medium">No customer subscribers yet</p>
                <p className="text-xs text-amber-700 mt-1">Customers can opt in to notifications after scanning your QR code.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="form-label">Title <span className="text-text-light font-normal">(max 80 chars)</span></label>
                  <input
                    className="form-input mt-1"
                    value={blastTitle}
                    onChange={e => setBlastTitle(e.target.value)}
                    placeholder="e.g. Double points this weekend! 🎉"
                    maxLength={80}
                  />
                  <p className="text-xs text-text-light text-right mt-1">{blastTitle.length}/80</p>
                </div>
                <div>
                  <label className="form-label">Message <span className="text-text-light font-normal">(max 200 chars)</span></label>
                  <textarea
                    className="form-input mt-1 resize-none"
                    rows={3}
                    value={blastBody}
                    onChange={e => setBlastBody(e.target.value)}
                    placeholder="e.g. Come visit us Sat–Sun and earn 2× loyalty points. Don't miss out!"
                    maxLength={200}
                  />
                  <p className="text-xs text-text-light text-right mt-1">{blastBody.length}/200</p>
                </div>
                {blastError   && <p className="text-xs text-status-error flex items-center gap-1"><AlertCircle size={12} /> {blastError}</p>}
                {blastSuccess && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> {blastSuccess}</p>}
                <button
                  onClick={sendBlast}
                  disabled={blasting || !blastTitle.trim() || !blastBody.trim()}
                  className="btn-primary text-sm py-2.5 flex items-center gap-2 w-full justify-center disabled:opacity-50">
                  <Send size={14} />
                  {blasting ? 'Sending…' : `Send to ${subCount} Customer${subCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>

          {/* Blast history */}
          {blasts.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw size={16} className="text-primary" />
                <h2 className="font-semibold text-text-dark">Recent Blasts</h2>
              </div>
              <div className="space-y-2">
                {blasts.map(b => (
                  <div key={b.id} className="rounded-xl bg-bg-muted border border-border-light px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-dark truncate">{b.title}</p>
                        <p className="text-xs text-text-medium mt-0.5 line-clamp-2">{b.body}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-primary">{b.recipient_count} sent</p>
                        <p className="text-xs text-text-light">{timeAgo(b.sent_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
