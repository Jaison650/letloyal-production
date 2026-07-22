'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

interface BillingMerchant {
  id:           string;
  business_name: string;
  email:        string;
  plan:         string;
  status:       string;
  billing_note: string | null;
  created_at:   string;
}

async function patchMerchant(id: string, patch: Record<string, string>): Promise<string | null> {
  try {
    const res = await fetch(`/api/admin/billing/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(patch),
    });
    if (!res.ok) { const d = await res.json(); return d.error || 'Update failed.'; }
    return null;
  } catch { return 'Network error.'; }
}

export default function AdminBillingPage() {
  const [merchants,   setMerchants]   = useState<BillingMerchant[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [patchError,  setPatchError]  = useState('');

  useEffect(() => {
    fetch('/api/admin/billing')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setMerchants(d.merchants); else setError(d.error); })
      .catch(() => setError('Failed to load.'))
      .finally(() => setLoading(false));
  }, []);

  function updateLocal(id: string, patch: Partial<BillingMerchant>) {
    setMerchants((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Billing</h1>
        <p className="text-sm text-ink-faint mt-1">Manage merchant plans and billing notes.</p>
      </div>
      {patchError && (
        <div className="mb-4 rounded-xl bg-bad-subtle border border-red-200 px-4 py-3 text-sm text-bad flex items-center justify-between">
          <span>{patchError}</span>
          <button onClick={() => setPatchError('')} className="ml-4 text-bad hover:text-bad">✕</button>
        </div>
      )}

      {loading ? (
        <p className="text-ink-sub text-sm">Loading…</p>
      ) : error ? (
        <p className="text-bad text-sm">{error}</p>
      ) : merchants.length === 0 ? (
        <div className="text-center py-12 text-ink-sub">
          <p className="font-semibold">No merchants yet</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke text-left">
                <th className="pb-3 pr-4 font-semibold text-ink-sub">Merchant</th>
                <th className="pb-3 pr-4 font-semibold text-ink-sub">Status</th>
                <th className="pb-3 pr-4 font-semibold text-ink-sub">Plan</th>
                <th className="pb-3 font-semibold text-ink-sub">Billing Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {merchants.map((m) => (
                <tr key={m.id}>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-ink">{m.business_name}</p>
                    <p className="text-xs text-ink-faint">{m.email}</p>
                  </td>

                  <td className="py-3 pr-4">
                    <select
                      value={m.status}
                      onChange={(e) => {
                        const status = e.target.value;
                        updateLocal(m.id, { status });
                        patchMerchant(m.id, { status }).then(e => { if (e) setPatchError(e); });
                      }}
                      className={clsx(
                        'text-xs font-semibold px-2 py-1 rounded-full border-0 outline-none cursor-pointer',
                        m.status === 'active'
                          ? 'bg-good-subtle text-good'
                          : 'bg-surface-2 text-ink-faint',
                      )}
                    >
                      <option value="active">active</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </td>

                  <td className="py-3 pr-4">
                    <select
                      value={m.plan}
                      onChange={(e) => {
                        const plan = e.target.value;
                        updateLocal(m.id, { plan });
                        patchMerchant(m.id, { plan }).then(e => { if (e) setPatchError(e); });
                      }}
                      className="text-xs font-medium px-2 py-1 rounded-lg border border-stroke bg-surface outline-none cursor-pointer"
                    >
                      <option value="free">free</option>
                      <option value="starter">starter</option>
                      <option value="pro">pro</option>
                    </select>
                  </td>

                  <td className="py-3">
                    <input
                      type="text"
                      defaultValue={m.billing_note ?? ''}
                      placeholder="Add note…"
                      onBlur={(e) => {
                        const billing_note = e.target.value;
                        updateLocal(m.id, { billing_note });
                        patchMerchant(m.id, { billing_note }).then(e => { if (e) setPatchError(e); });
                      }}
                      className="w-full text-xs px-2 py-1 rounded-lg border border-stroke bg-surface outline-none focus:border-primary transition-colors"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
