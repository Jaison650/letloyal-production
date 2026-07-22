'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gift } from 'lucide-react';
import { Badge } from '@/components/ds';
import { AnimatedProgress, progressCopy } from '../motion';
import { merchantAccentVars } from '@/lib/merchantColor';
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
  const fraction = isUnlocked ? 1 : (card.reward_threshold > 0 ? card.progress / card.reward_threshold : 0);
  const remaining = Math.max(0, card.reward_threshold - card.progress);
  const isSpend = card.campaign_type === 'spend_based';
  const unit = isSpend ? 'point' : 'visit';
  // Goal-gradient: past 75% the card switches to honey urgency cues.
  const nearGoal = !isUnlocked && card.reward_threshold > 0 && fraction >= 0.75;
  return (
    <div
      className={`relative pl-4 rounded-[16px] border bg-surface-1 shadow-ds overflow-hidden ${isUnlocked ? 'border-reward/40' : 'border-stroke'}`}
      style={merchantAccentVars(card.merchant_slug)}
    >
      {/* Merchant identity — colour strip + soft glow, derived from the slug */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: 'var(--m)' }} />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-6 -top-8 w-32 h-32 rounded-full blur-3xl"
        style={{ background: 'var(--m)', opacity: 0.1 }}
      />
      <div className="relative flex items-center gap-3 px-4 pt-4 pb-2">
        <Link href={`/p/${card.merchant_slug}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <MerchantAvatar logo_url={card.logo_url} name={card.business_name} size={44} accent="var(--m)" />
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-ink truncate">{card.business_name}</p>
            <p className="text-xs text-ink-faint">{isSpend ? 'Spend-based' : 'Visit-based'} · {card.campaign_name}</p>
          </div>
        </Link>
        {isUnlocked
          ? <Badge intent="reward" className="flex-shrink-0">Ready!</Badge>
          : nearGoal && <Badge intent="reward" dot={false} className="flex-shrink-0">{remaining} to go</Badge>}
      </div>
      <div className="relative px-4 pb-4">
        <p className="text-sm font-bold text-reward-deep flex items-center gap-1.5 mb-2">
          <Gift size={13} className="flex-shrink-0" />{card.reward_description}
        </p>
        <div className="flex items-center justify-between mb-1.5">
          {isUnlocked
            ? <span className="text-xs font-semibold text-reward-deep tabular-nums">Reward earned</span>
            : <span className="text-xs text-ink-sub tabular-nums">{card.progress} / {card.reward_threshold} {isSpend ? 'points' : 'visits'}</span>}
          {isUnlocked
            ? <span className="text-xs font-semibold text-reward-deep">Reward ready!</span>
            : <span className="text-xs text-ink-faint">{remaining} more to go</span>}
        </div>
        <AnimatedProgress fraction={fraction} rewardReady={isUnlocked} />
        {!isUnlocked && (
          <p className="mt-1.5 text-xs text-ink-faint">{progressCopy(card.progress, card.reward_threshold, unit, card.reward_description)}</p>
        )}
        {isUnlocked && !showCode && (
          <button onClick={() => setShowCode(true)}
            className="mt-3 w-full bg-teal hover:bg-teal-hover text-teal-fg font-semibold py-2.5 rounded-full flex items-center justify-center gap-2 transition-colors">
            <Gift size={16} /> Redeem Now
          </button>
        )}
        {isUnlocked && showCode && <InlineRedeemCode phone={phone} slug={card.merchant_slug} onCancel={() => setShowCode(false)} />}
        <ActiveOffersBanner slug={card.merchant_slug} />
      </div>
    </div>
  );
}
