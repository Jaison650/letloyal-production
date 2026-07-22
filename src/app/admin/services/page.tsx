'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

interface ServicesData {
  db: { merchants: number; customers: number; visits: number };
  services: { smtp: boolean; r2: boolean; webpush: boolean; google_oauth: boolean };
  uptime: number;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AdminServicesPage() {
  const [data,    setData]    = useState<ServicesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetch('/api/admin/services')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setData(d); else setError(d.error); })
      .catch(() => setError('Failed to load.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Services Health</h1>
        <p className="text-sm text-ink-faint mt-1">DB counts, integration status, and server uptime.</p>
      </div>

      {loading ? (
        <p className="text-ink-sub text-sm">Loading…</p>
      ) : error ? (
        <p className="text-bad text-sm">{error}</p>
      ) : data ? (
        <div className="space-y-6">

          {/* DB stats */}
          <div>
            <h2 className="text-sm font-semibold text-ink-sub uppercase tracking-wide mb-3">Database</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Active Merchants', value: data.db.merchants },
                { label: 'Customers',         value: data.db.customers },
                { label: 'Visits',            value: data.db.visits },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[16px] border border-stroke bg-surface-1 shadow-ds p-5 text-center">
                  <p className="text-3xl font-bold text-ink">{stat.value.toLocaleString()}</p>
                  <p className="text-xs text-ink-faint mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Service status */}
          <div>
            <h2 className="text-sm font-semibold text-ink-sub uppercase tracking-wide mb-3">Integrations</h2>
            <div className="rounded-[16px] border border-stroke bg-surface-1 shadow-ds p-5 space-y-3">
              {(
                [
                  { key: 'smtp',         label: 'SMTP Email' },
                  { key: 'r2',           label: 'Cloudflare R2 Storage' },
                  { key: 'webpush',      label: 'Web Push (VAPID)' },
                  { key: 'google_oauth', label: 'Google OAuth' },
                ] as { key: keyof ServicesData['services']; label: string }[]
              ).map(({ key, label }) => {
                const ok = data.services[key];
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-ink">{label}</span>
                    <span
                      className={clsx(
                        'text-xs font-semibold px-2.5 py-1 rounded-full',
                        ok ? 'bg-good-subtle text-good' : 'bg-bad-subtle text-bad',
                      )}
                    >
                      {ok ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Uptime */}
          <div>
            <h2 className="text-sm font-semibold text-ink-sub uppercase tracking-wide mb-3">Server</h2>
            <div className="rounded-[16px] border border-stroke bg-surface-1 shadow-ds p-5 flex items-center justify-between">
              <span className="text-sm text-ink">Process Uptime</span>
              <span className="text-sm font-semibold text-ink">{formatUptime(data.uptime)}</span>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}
