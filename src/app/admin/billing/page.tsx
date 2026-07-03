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

async function patchMerchant(id: string, patch: Record<string, string>) {
  await fetch(`/api/admin/billing/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(patch),
  });
}

export default function AdminBillingPage() {
  const [merchants, setMerchants] = useState<BillingMerchant[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

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
        <h1 className="text-2xl font-bold text-text-dark">Billing</h1>
        <p className="text-sm text-text-light mt-1">Manage merchant plans and billing notes.</p>
      </div>

      {loading ? (
        <p className="text-text-medium text-sm">Loading…</p>
      ) : error ? (
        <p className="text-status-error text-sm">{error}</p>
      ) : merchants.length === 0 ? (
        <div className="text-center py-12 text-text-medium">
          <p className="font-semibold">No merchants yet</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light text-left">
                <th className="pb-3 pr-4 font-semibold text-text-medium">Merchant</th>
                <th className="pb-3 pr-4 font-semibold text-text-medium">Status</th>
                <th className="pb-3 pr-4 font-semibold text-text-medium">Plan</th>
                <th className="pb-3 font-semibold text-text-medium">Billing Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {merchants.map((m) => (
                <tr key={m.id}>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-text-dark">{m.business_name}</p>
                    <p className="text-xs text-text-light">{m.email}</p>
                  </td>

                  <td className="py-3 pr-4">
                    <select
                      value={m.status}
                      onChange={(e) => {
                        const status = e.target.value;
                        updateLocal(m.id, { status });
                        patchMerchant(m.id, { status });
                      }}
                      className={clsx(
                        'text-xs font-semibold px-2 py-1 rounded-full border-0 outline-none cursor-pointer',
                        m.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500',
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
                        patchMerchant(m.id, { plan });
                      }}
                      className="text-xs font-medium px-2 py-1 rounded-lg border border-border-light bg-surface outline-none cursor-pointer"
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
                        patchMerchant(m.id, { billing_note });
                      }}
                      className="w-full text-xs px-2 py-1 rounded-lg border border-border-light bg-surface outline-none focus:border-primary transition-colors"
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
