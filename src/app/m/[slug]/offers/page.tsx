'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Badge, Card, Input, Textarea } from '@/components/ds';

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
          <h1 className="text-2xl font-bold text-ink">Instant Offers</h1>
          <p className="text-sm text-ink-faint mt-1">Time-limited promotions shown to customers.</p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}>+ New Offer</Button>
        )}
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="rounded-[16px] border border-stroke bg-surface-1 shadow-ds p-5 mb-6">
          <h2 className="font-semibold text-ink mb-4">New Offer</h2>
          {formErr && <p className="text-bad text-sm mb-3">{formErr}</p>}
          <div className="space-y-3">
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">Title</label>
              <Input
                className="w-full"
                placeholder="e.g. 20% off all beverages"
                maxLength={120}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">Description (optional)</label>
              <Textarea
                className="w-full"
                rows={2}
                placeholder="More details…"
                maxLength={500}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">Valid Until</label>
              <Input
                type="datetime-local"
                className="w-full"
                value={form.valid_until}
                min={new Date().toISOString().slice(0, 16)}
                onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create Offer'}
            </Button>
            <Button type="button" intent="secondary" onClick={() => { setCreating(false); setFormErr(''); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-ink-sub text-sm">Loading…</p>
      ) : error ? (
        <p className="text-bad text-sm">{error}</p>
      ) : (
        <div className="space-y-4">
          {active.length === 0 && !creating && (
            <Card padding="md" className="text-center py-8 text-ink-sub">
              <p className="font-semibold">No active offers</p>
              <p className="text-sm mt-1">Create an offer to attract customers today.</p>
            </Card>
          )}
          {active.map(o => (
            <Card key={o.id} padding="md" className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge intent="success">ACTIVE</Badge>
                  <p className="font-semibold text-ink">{o.title}</p>
                </div>
                {o.description && <p className="text-sm text-ink-sub mt-1">{o.description}</p>}
                <p className="text-xs text-ink-faint mt-1">
                  Expires {new Date(o.valid_until).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => handleDelete(o.id)}
                className="text-bad text-sm hover:underline shrink-0"
              >
                Delete
              </button>
            </Card>
          ))}
          {expired.length > 0 && (
            <details className="mt-2">
              <summary className="text-sm text-ink-faint cursor-pointer select-none">
                Show {expired.length} expired offer{expired.length > 1 ? 's' : ''}
              </summary>
              <div className="mt-2 space-y-2">
                {expired.map(o => (
                  <Card key={o.id} padding="md" className="opacity-60 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink">{o.title}</p>
                      <p className="text-xs text-ink-faint">
                        Expired {new Date(o.valid_until).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(o.id)}
                      className="text-bad text-sm hover:underline shrink-0"
                    >
                      Delete
                    </button>
                  </Card>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
