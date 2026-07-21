'use client';

import { useEffect } from 'react';
import { Gift, Star } from 'lucide-react';
import { CountUp, AnimatedProgress } from './motion';

interface MilestoneCardProps {
  businessName:      string;
  progress:          number;
  threshold:         number;
  rewardDescription: string;
  rewardUnlocked:    boolean;
  pointsAdded:       number;
  campaignType:      'visit_based' | 'spend_based';
}

export default function MilestoneCard({
  businessName,
  progress,
  threshold,
  rewardDescription,
  rewardUnlocked,
  pointsAdded,
  campaignType,
}: MilestoneCardProps) {

  // ── Confetti on reward unlock ───────────────────────────────────────
  useEffect(() => {
    if (!rewardUnlocked) return;
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 120,
        spread:        80,
        origin:        { y: 0.6 },
        colors:        ['#0D9488', '#5EEAD4', '#CCFBF1', '#F59E0B', '#FDE68A'],
      });
      setTimeout(() => confetti({
        particleCount: 60,
        angle:         60,
        spread:        55,
        origin:        { x: 0, y: 0.65 },
      }), 300);
      setTimeout(() => confetti({
        particleCount: 60,
        angle:         120,
        spread:        55,
        origin:        { x: 1, y: 0.65 },
      }), 500);
    });
  }, [rewardUnlocked]);

  const remaining = Math.max(0, threshold - progress);
  const prev      = Math.max(0, progress - pointsAdded);
  const unit      = campaignType === 'visit_based' ? 'stamp' : 'point';
  const nearGoal  = threshold > 0 && progress / threshold >= 0.75;

  // ── Unlocked state ───────────────────────────────────────────────────
  if (rewardUnlocked) {
    return (
      <div className="rounded-[16px] overflow-hidden shadow-ds border border-reward/40 bg-surface-1 animate-pop-in">
        {/* Header — celebratory honey band */}
        <div className="relative overflow-hidden bg-section-dark px-6 py-8 text-center">
          <span aria-hidden className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-x" />
          <div className="relative w-20 h-20 rounded-full bg-reward/20 flex items-center justify-center mx-auto mb-3">
            <Gift size={36} className="text-[#F2C230]" />
          </div>
          <h2 className="relative text-2xl font-display font-extrabold text-white mb-1">🎉 Reward Unlocked!</h2>
          <p className="relative text-[#AEBDB5] text-sm">{businessName}</p>
        </div>

        {/* Reward */}
        <div className="px-6 py-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-reward-subtle text-reward-deep font-bold text-sm mb-4">
            <Star size={14} className="fill-current" />
            Your Reward
          </div>
          <p className="text-xl font-display font-bold text-ink mb-4">{rewardDescription}</p>
          <div className="rounded-[11px] bg-reward-subtle border border-reward/40 px-4 py-3 text-sm text-reward-deep font-medium">
            Show this screen to the staff to claim your reward!
          </div>
        </div>

        {/* Points added badge */}
        <div className="px-6 pb-6 text-center">
          <span className="text-xs text-ink-faint">
            +{pointsAdded} {unit}{pointsAdded !== 1 ? 's' : ''} added · {progress}/{threshold} total
          </span>
        </div>
      </div>
    );
  }

  // ── In-progress state ────────────────────────────────────────────────
  return (
    <div className="rounded-[16px] overflow-hidden shadow-ds border border-stroke bg-surface-1 animate-pop-in">
      {/* Header */}
      <div className="bg-section-dark px-6 py-6">
        <p className="text-[#AEBDB5] text-xs font-medium mb-1 uppercase tracking-wide">{businessName}</p>
        <h2 className="text-xl font-display font-extrabold text-white">Loyalty Card</h2>
      </div>

      {/* Progress */}
      <div className="px-6 py-6 space-y-4">

        {/* Points added flash */}
        <div className="flex items-center justify-between">
          <span className="text-ink-sub text-sm">Progress</span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-teal [font-variant-numeric:tabular-nums]">
            <CountUp to={pointsAdded} /> {unit}{pointsAdded !== 1 ? 's' : ''} earned!
          </span>
        </div>

        {/* Progress bar — animates old → new */}
        <AnimatedProgress
          fraction={threshold > 0 ? progress / threshold : 0}
          from={threshold > 0 ? prev / threshold : 0}
          rewardReady={nearGoal}
        />

        {/* Progress counter */}
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-display font-extrabold text-ink [font-variant-numeric:tabular-nums]">
            {progress}
            <span className="text-lg font-medium text-ink-faint">/{threshold}</span>
          </span>
          <span className="text-sm text-ink-sub">
            {campaignType === 'visit_based' ? 'stamps' : 'points'}
          </span>
        </div>

        {/* Reward description — goal-gradient countdown */}
        <div className={`rounded-[11px] px-4 py-3 ${nearGoal ? 'bg-reward-subtle border border-reward/40' : 'bg-teal-subtle'}`}>
          <div className="flex items-start gap-2">
            <Gift size={16} className={`mt-0.5 flex-shrink-0 ${nearGoal ? 'text-reward-deep' : 'text-teal'}`} />
            <div>
              <p className={`text-xs font-bold mb-0.5 ${nearGoal ? 'text-reward-deep' : 'text-teal'}`}>
                Only {remaining} {unit}{remaining !== 1 ? 's' : ''} to go!
              </p>
              <p className={`text-xs ${nearGoal ? 'text-reward-deep/80' : 'text-teal/80'}`}>{rewardDescription}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
