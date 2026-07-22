'use client';

import { useEffect, useState, FormEvent } from 'react';
import { Plus, ExternalLink, Users, BarChart2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { clsx } from 'clsx';

interface Merchant {
  id:             string;
  slug:           string;
  business_name:  string;
  email:          string;
  status:         string;
  created_at:     string;
  customer_count: number;
  visit_count:    number;
}

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [error,     setError]     = useState('');

  // Form state
  const [fSlug,     setFSlug]     = useState('');
  const [fName,     setFName]     = useState('');
  const [fEmail,    setFEmail]    = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fSaving,   setFSaving]   = useState(false);
  const [fError,    setFError]    = useState('');

  function loadMerchants() {
    setLoading(true);
    fetch('/api/admin/merchants')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setMerchants(d.merchants); else setError(d.error); })
      .catch(() => setError('Failed to load.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadMerchants, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFError('');
    setFSaving(true);
    try {
      const res  = await fetch('/api/admin/merchants', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ slug: fSlug, business_name: fName, email: fEmail, password: fPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setFError(data.error || 'Create failed.'); return; }

      setShowForm(false);
      setFSlug(''); setFName(''); setFEmail(''); setFPassword('');
      loadMerchants();
    } catch {
      setFError('Something went wrong.');
    } finally {
      setFSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">Merchants</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> {showForm ? 'Cancel' : 'Add Merchant'}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card mb-6 max-w-lg">
          <h2 className="font-bold text-ink mb-4">New Merchant</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Slug" value={fSlug} onChange={(e) => setFSlug(e.target.value)}
                placeholder="coffee-house" required />
              <Input label="Business Name" value={fName} onChange={(e) => setFName(e.target.value)}
                placeholder="Coffee House" required />
            </div>
            <Input label="Email" type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)}
              placeholder="owner@business.com" required />
            <Input label="Temp Password" type="password" value={fPassword}
              onChange={(e) => setFPassword(e.target.value)} placeholder="Min 8 chars" required />

            {fError && (
              <div className="rounded-xl bg-bad-subtle border border-red-200 px-4 py-3 text-sm text-bad">
                {fError}
              </div>
            )}

            <Button type="submit" loading={fSaving} fullWidth>Create Merchant</Button>
          </form>
        </div>
      )}

      {/* Merchant table */}
      {loading ? (
        <p className="text-ink-sub text-sm">Loading…</p>
      ) : error ? (
        <p className="text-bad text-sm">{error}</p>
      ) : merchants.length === 0 ? (
        <div className="text-center py-12 text-ink-sub">
          <p className="font-semibold">No merchants yet</p>
          <p className="text-sm mt-1">Add your first merchant using the button above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {merchants.map((m) => (
            <div key={m.id} className="card flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-ink truncate">{m.business_name}</p>
                  <span className={clsx(
                    'text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0',
                    m.status === 'active' ? 'bg-good-subtle text-good' : 'bg-surface-2 text-ink-faint',
                  )}>
                    {m.status}
                  </span>
                </div>
                <p className="text-xs text-ink-faint">{m.email} · /{m.slug}</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-ink-sub flex-shrink-0">
                <span className="flex items-center gap-1">
                  <Users size={13} /> {m.customer_count}
                </span>
                <span className="flex items-center gap-1">
                  <BarChart2 size={13} /> {m.visit_count}
                </span>
              </div>

              <a
                href={`/m/${m.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-teal-subtle text-ink-faint hover:text-teal transition-colors flex-shrink-0"
                title="Open merchant dashboard"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
