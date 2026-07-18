'use client';

import { useState, useEffect } from 'react';
import { Tag } from 'lucide-react';

// ── Active Offers Banner ──────────────────────────────────────────────────────
interface ActiveOffer { id: string; title: string; description: string | null; valid_until: string; }

export default function ActiveOffersBanner({ slug }: { slug: string }) {
  const [offers, setOffers] = useState<ActiveOffer[]>([]);

  useEffect(() => {
    fetch(`/api/offers?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(d => { if (d.ok && d.offers.length > 0) setOffers(d.offers); })
      .catch(() => {/* silently ignore */});
  }, [slug]);

  if (offers.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-reward-deep flex items-center gap-1">
        <Tag size={11} /> Special Offers
      </p>
      {offers.map(o => (
        <div key={o.id} className="rounded-[11px] bg-reward-subtle border border-reward/40 px-3 py-2.5">
          <p className="font-semibold text-reward-deep text-sm">{o.title}</p>
          {o.description && <p className="text-xs text-reward-deep/80 mt-0.5">{o.description}</p>}
          <p className="text-xs text-reward-deep/70 mt-1">
            Valid until {new Date(o.valid_until).toLocaleString('en-IN')}
          </p>
        </div>
      ))}
    </div>
  );
}
