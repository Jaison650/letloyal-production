'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gift } from 'lucide-react';
import { MerchantAvatar } from './ui';
import InlineRedeemCode from './InlineRedeemCode';
import ActiveOffersBanner from './ActiveOffersBanner';
import type { LoyaltyCard } from './types';

// ── Loyalty Card ──────────────────────────────────────────────────────────────
export default function LoyaltyCardItem({ card, phone }: { card: LoyaltyCard; phone: string }) {
  const [showCode, setShowCode] = useState(false);
  const isUnlocked = card.reward_status === 'unlocked';
  // Unlocked rewards are "earned" — show the bar full even if the merchant has
  // since raised the threshold above the customer's progress (rewards are
  // grandfathered), so the card never contradicts itself (e.g. "100/1000" + "ready").
  const pct = isUnlocked ? 100 : Math.min(100, Math.round((card.progress / card.reward_threshold) * 100));
  const remaining = Math.max(0, card.reward_threshold - card.progress);
  const isSpend = card.campaign_type === 'spend_based';
  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${isUnlocked ? 'border-primary' : 'border-border-light'}`}>
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Link href={`/p/${card.merchant_slug}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <MerchantAvatar logo_url={card.logo_url} name={card.business_name} size={44} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text-dark truncate">{card.business_name}</p>
            <p className="text-xs text-text-light">{isSpend ? 'Spend-based' : 'Visit-based'} · {card.campaign_name}</p>
          </div>
        </Link>
        {isUnlocked && <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded-full flex-shrink-0">🎉 Ready!</span>}
      </div>
      <div className="px-4 pb-4">
        <p className="text-sm font-semibold text-text-dark flex items-center gap-1.5 mb-2">
          <Gift size={13} className="text-primary flex-shrink-0" />{card.reward_description}
        </p>
        <div className="flex items-center justify-between mb-1.5">
          {isUnlocked
            ? <span className="text-xs font-semibold text-primary tabular-nums">Reward earned</span>
            : <span className="text-xs text-text-medium tabular-nums">{card.progress} / {card.reward_threshold} {isSpend ? 'points' : 'visits'}</span>}
          {isUnlocked
            ? <span className="text-xs font-semibold text-primary">🎉 Reward ready!</span>
            : <span className="text-xs text-text-light">{remaining} more to go</span>}
        </div>
        <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${isUnlocked ? 'bg-primary' : 'bg-primary/60'}`} style={{ width: `${pct}%` }} />
        </div>
        {isUnlocked && !showCode && (
          <button onClick={() => setShowCode(true)}
            className="mt-3 w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Gift size={16} /> Redeem Now
          </button>
        )}
        {isUnlocked && showCode && <InlineRedeemCode phone={phone} slug={card.merchant_slug} onCancel={() => setShowCode(false)} />}
        <ActiveOffersBanner slug={card.merchant_slug} />
      </div>
    </div>
  );
}
