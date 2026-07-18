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
        <div className="rounded-[16px] border border-stroke bg-surface-1 shadow-ds p-10 text-center space-y-3">
          <CreditCard size={40} className="text-ink-faint mx-auto opacity-30" />
          <p className="font-semibold text-ink-sub">No loyalty cards yet</p>
          <p className="text-sm text-ink-faint">Scan a QR code at any LetLoyal store to start earning rewards.</p>
        </div>
      ) : (
        <>
          {unlocked.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-bold text-reward-deep uppercase tracking-wide flex items-center gap-1"><Gift size={12} /> Rewards Ready to Claim ({unlocked.length})</p>
              {unlocked.map((card, i) => (
                <div key={i}
                  ref={el => { cardRefs.current[card.merchant_slug] = el; }}
                  className={`rounded-[16px] transition-all duration-500 ${highlightSlug === card.merchant_slug ? 'ring-2 ring-teal ring-offset-2' : ''}`}>
                  <LoyaltyCardItem card={card} phone={phone} />
                </div>
              ))}
            </section>
          )}
          {cards.filter(c => c.reward_status !== 'unlocked').length > 0 && (
            <section className="space-y-3">
              {unlocked.length > 0 && <p className="text-xs font-bold text-ink-sub uppercase tracking-wide">In Progress ({cards.filter(c => c.reward_status !== 'unlocked').length})</p>}
              {cards.filter(c => c.reward_status !== 'unlocked').map((card, i) => (
                <div key={i}
                  ref={el => { cardRefs.current[card.merchant_slug] = el; }}
                  className={`rounded-[16px] transition-all duration-500 ${highlightSlug === card.merchant_slug ? 'ring-2 ring-teal ring-offset-2' : ''}`}>
                  <LoyaltyCardItem card={card} phone={phone} />
                </div>
              ))}
            </section>
          )}
        </>
      )}
      {stores.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="text-xs font-semibold text-ink-sub uppercase tracking-wide flex items-center gap-1.5"><MapPin size={13} /> Discover Stores</h2>
          <p className="text-xs text-ink-faint -mt-1">Earn rewards at any LetLoyal store</p>
          {stores.map((store, i) => <DiscoverCard key={i} store={store} />)}
        </section>
      )}
    </>
  );
}
