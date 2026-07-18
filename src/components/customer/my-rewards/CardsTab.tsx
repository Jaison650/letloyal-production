'use client';

import { CreditCard, Gift, MapPin } from 'lucide-react';
import type { MutableRefObject } from 'react';
import LoyaltyCardItem from './LoyaltyCardItem';
import DiscoverCard from './DiscoverCard';
import type { LoyaltyCard, DiscoverStore } from './types';

// ── Cards tab ─────────────────────────────────────────────────────────────────
export default function CardsTab({ cards, unlocked, stores, highlightSlug, cardRefs, phone }: {
  cards: LoyaltyCard[];
  unlocked: LoyaltyCard[];
  stores: DiscoverStore[];
  highlightSlug: string | null;
  cardRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  phone: string;
}) {
  return (
    <>
      {cards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border-light p-10 text-center space-y-3">
          <CreditCard size={40} className="text-text-light mx-auto opacity-30" />
          <p className="font-semibold text-text-medium">No loyalty cards yet</p>
          <p className="text-sm text-text-light">Scan a QR code at any LetLoyal store to start earning rewards.</p>
        </div>
      ) : (
        <>
          {unlocked.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1"><Gift size={12} /> Rewards Ready to Claim ({unlocked.length})</p>
              {unlocked.map((card, i) => (
                <div key={i}
                  ref={el => { cardRefs.current[card.merchant_slug] = el; }}
                  className={`rounded-2xl transition-all duration-500 ${highlightSlug === card.merchant_slug ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                  <LoyaltyCardItem card={card} phone={phone} />
                </div>
              ))}
            </section>
          )}
          {cards.filter(c => c.reward_status !== 'unlocked').length > 0 && (
            <section className="space-y-3">
              {unlocked.length > 0 && <p className="text-xs font-bold text-text-medium uppercase tracking-wide">In Progress ({cards.filter(c => c.reward_status !== 'unlocked').length})</p>}
              {cards.filter(c => c.reward_status !== 'unlocked').map((card, i) => (
                <div key={i}
                  ref={el => { cardRefs.current[card.merchant_slug] = el; }}
                  className={`rounded-2xl transition-all duration-500 ${highlightSlug === card.merchant_slug ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                  <LoyaltyCardItem card={card} phone={phone} />
                </div>
              ))}
            </section>
          )}
        </>
      )}
      {stores.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="text-xs font-semibold text-text-medium uppercase tracking-wide flex items-center gap-1.5"><MapPin size={13} /> Discover Stores</h2>
          <p className="text-xs text-text-light -mt-1">Earn rewards at any LetLoyal store</p>
          {stores.map((store, i) => <DiscoverCard key={i} store={store} />)}
        </section>
      )}
    </>
  );
}
