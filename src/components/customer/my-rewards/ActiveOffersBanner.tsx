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
      <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
        <Tag size={11} /> Special Offers
      </p>
      {offers.map(o => (
        <div key={o.id} className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
          <p className="font-semibold text-amber-900 text-sm">{o.title}</p>
          {o.description && <p className="text-xs text-amber-700 mt-0.5">{o.description}</p>}
          <p className="text-xs text-amber-600 mt-1">
            Valid until {new Date(o.valid_until).toLocaleString('en-IN')}
          </p>
        </div>
      ))}
    </div>
  );
}
