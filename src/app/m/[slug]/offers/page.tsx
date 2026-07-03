'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Offer {
  id: string;
  title: string;
  description: string | null;
  valid_until: string;
  created_at: string;
}

export default function OffersPage() {
  const { slug } = useParams<{ slug: string }>();
  const [offers,   setOffers]   = useState<Offer[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [creating, setCreating] = useState(false);
  const [form,     setForm]     = useState({ title: '', description: '', valid_until: '' });
  const [formErr,  setFormErr]  = useState('');
  const [saving,   setSaving]   = useState(false);

  async function loadOffers() {
    try {
      const r = await fetch(`/api/merchant/${slug}/offers`);
      const d = await r.json();
      if (d.ok) setOffers(d.offers);
      else setError(d.error ?? 'Failed to load.');
    } catch {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOffers(); }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormErr('');
    setSaving(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { setFormErr(d.error ?? 'Failed to create.'); return; }
      await loadOffers();
      setCreating(false);
      setForm({ title: '', description: '', valid_until: '' });
    } catch {
      setFormErr('Connection error.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this offer?')) return;
    const res = await fetch(`/api/merchant/${slug}/offers/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || 'Failed to delete. Please try again.');
      return;
    }
    setOffers(prev => prev.filter(o => o.id !== id));
  }

  const now     = new Date();
  const active  = offers.filter(o => new Date(o.valid_until) > now);
  const expired = offers.filter(o => new Date(o.valid_until) <= now);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Instant Offers</h1>
          <p className="text-sm text-text-light mt-1">Time-limited promotions shown to customers.</p>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} className="btn-primary">+ New Offer</button>
        )}
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="card mb-6">
          <h2 className="font-semibold text-text-dark mb-4">New Offer</h2>
          {formErr && <p className="text-status-error text-sm mb-3">{formErr}</p>}
          <div className="space-y-3">
            <div>
              <label className="label">Title</label>
              <input
                className="input w-full"
                placeholder="e.g. 20% off all beverages"
                maxLength={120}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <textarea
                className="input w-full"
                rows={2}
                placeholder="More details…"
                maxLength={500}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Valid Until</label>
              <input
                type="datetime-local"
                className="input w-full"
                value={form.valid_until}
                min={new Date().toISOString().slice(0, 16)}
                onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Offer'}
            </button>
            <button type="button" onClick={() => { setCreating(false); setFormErr(''); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-text-medium text-sm">Loading…</p>
      ) : error ? (
        <p className="text-status-error text-sm">{error}</p>
      ) : (
        <div className="space-y-4">
          {active.length === 0 && !creating && (
            <div className="card text-center py-8 text-text-medium">
              <p className="font-semibold">No active offers</p>
              <p className="text-sm mt-1">Create an offer to attract customers today.</p>
            </div>
          )}
          {active.map(o => (
            <div key={o.id} className="card flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">ACTIVE</span>
                  <p className="font-semibold text-text-dark">{o.title}</p>
                </div>
                {o.description && <p className="text-sm text-text-medium mt-1">{o.description}</p>}
                <p className="text-xs text-text-light mt-1">
                  Expires {new Date(o.valid_until).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => handleDelete(o.id)}
                className="text-status-error text-sm hover:underline shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
          {expired.length > 0 && (
            <details className="mt-2">
              <summary className="text-sm text-text-light cursor-pointer select-none">
                Show {expired.length} expired offer{expired.length > 1 ? 's' : ''}
              </summary>
              <div className="mt-2 space-y-2">
                {expired.map(o => (
                  <div key={o.id} className="card opacity-60 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-text-dark">{o.title}</p>
                      <p className="text-xs text-text-light">
                        Expired {new Date(o.valid_until).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(o.id)}
                      className="text-status-error text-sm hover:underline shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
