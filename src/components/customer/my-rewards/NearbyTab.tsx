'use client';

import { Navigation, MapPin, ArrowRight } from 'lucide-react';
import { Spinner, MerchantAvatar } from './ui';

interface NearbyStore { id: string; business_name: string; slug: string; logo_url: string | null; distance_km: number; }

// ── Nearby tab ────────────────────────────────────────────────────────────────
export default function NearbyTab({
  nearbyStores, setNearbyStores, nearbyLoading, nearbyError, setNearbyError, handleFindNearby,
}: {
  nearbyStores: NearbyStore[] | null;
  setNearbyStores: (v: NearbyStore[] | null) => void;
  nearbyLoading: boolean;
  nearbyError: string;
  setNearbyError: (v: string) => void;
  handleFindNearby: () => void;
}) {
  return (
    <div className="space-y-4">
      {!nearbyStores && !nearbyLoading && (
        <div className="rounded-[16px] border border-stroke bg-surface-1 shadow-ds p-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-teal-subtle flex items-center justify-center mx-auto">
            <Navigation size={40} className="text-teal" />
          </div>
          <div>
            <p className="font-bold text-ink text-lg">Find Stores Near You</p>
            <p className="text-sm text-ink-faint mt-1">Discover LetLoyal stores within 5 km of your current location.</p>
          </div>
          {nearbyError && <p className="text-sm text-bad">{nearbyError}</p>}
          <button
            onClick={handleFindNearby}
            className="w-full bg-teal hover:bg-teal-hover text-teal-fg font-semibold py-3 rounded-full flex items-center justify-center gap-2 transition-colors"
          >
            <MapPin size={18} /> Find Stores Near Me
          </button>
        </div>
      )}
      {nearbyLoading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Spinner />
          <p className="text-sm text-ink-sub">Finding nearby stores…</p>
        </div>
      )}
      {nearbyStores && !nearbyLoading && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink-sub uppercase tracking-wide">
              {nearbyStores.length === 0
                ? 'No stores found'
                : `${nearbyStores.length} store${nearbyStores.length > 1 ? 's' : ''} within 5 km`}
            </p>
            <button
              onClick={() => { setNearbyStores(null); setNearbyError(''); }}
              className="text-xs text-teal font-medium hover:underline"
            >
              Search again
            </button>
          </div>
          {nearbyStores.length === 0 ? (
            <div className="rounded-[16px] border border-stroke bg-surface-1 shadow-ds p-8 text-center">
              <MapPin size={36} className="text-ink-faint mx-auto opacity-30 mb-3" />
              <p className="font-semibold text-ink-sub">No stores found within 5 km</p>
              <p className="text-sm text-ink-faint mt-1">Try again from a different location or check back later.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {nearbyStores.map(s => (
                <a
                  key={s.id}
                  href={`/p/${s.slug}`}
                  className="flex items-center gap-3 rounded-[16px] border border-stroke bg-surface-1 shadow-ds p-4 hover:border-teal transition-colors"
                >
                  <MerchantAvatar logo_url={s.logo_url} name={s.business_name} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">{s.business_name}</p>
                    <p className="text-xs text-ink-faint">{s.distance_km.toFixed(1)} km away</p>
                  </div>
                  <ArrowRight size={16} className="text-ink-faint flex-shrink-0" />
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
