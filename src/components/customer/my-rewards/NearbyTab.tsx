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
        <div className="bg-white rounded-2xl border border-border-light p-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center mx-auto">
            <Navigation size={40} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-text-dark text-lg">Find Stores Near You</p>
            <p className="text-sm text-text-light mt-1">Discover LetLoyal stores within 5 km of your current location.</p>
          </div>
          {nearbyError && <p className="text-sm text-status-error">{nearbyError}</p>}
          <button
            onClick={handleFindNearby}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <MapPin size={18} /> Find Stores Near Me
          </button>
        </div>
      )}
      {nearbyLoading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Spinner />
          <p className="text-sm text-text-medium">Finding nearby stores…</p>
        </div>
      )}
      {nearbyStores && !nearbyLoading && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-text-medium uppercase tracking-wide">
              {nearbyStores.length === 0
                ? 'No stores found'
                : `${nearbyStores.length} store${nearbyStores.length > 1 ? 's' : ''} within 5 km`}
            </p>
            <button
              onClick={() => { setNearbyStores(null); setNearbyError(''); }}
              className="text-xs text-primary font-medium hover:underline"
            >
              Search again
            </button>
          </div>
          {nearbyStores.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border-light p-8 text-center">
              <MapPin size={36} className="text-text-light mx-auto opacity-30 mb-3" />
              <p className="font-semibold text-text-medium">No stores found within 5 km</p>
              <p className="text-sm text-text-light mt-1">Try again from a different location or check back later.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {nearbyStores.map(s => (
                <a
                  key={s.id}
                  href={`/p/${s.slug}`}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-border-light shadow-sm p-4 hover:border-primary transition-colors"
                >
                  <MerchantAvatar logo_url={s.logo_url} name={s.business_name} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-dark truncate">{s.business_name}</p>
                    <p className="text-xs text-text-light">{s.distance_km.toFixed(1)} km away</p>
                  </div>
                  <ArrowRight size={16} className="text-text-light flex-shrink-0" />
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
