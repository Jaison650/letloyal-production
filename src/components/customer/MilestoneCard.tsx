'use client';

import { useEffect } from 'react';
import ProgressBar from '@/components/ui/ProgressBar';
import { Gift, Star } from 'lucide-react';

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

  const pct     = Math.min(100, Math.round((progress / threshold) * 100));
  const remaining = Math.max(0, threshold - progress);
  const unit    = campaignType === 'visit_based' ? 'stamp' : 'point';

  // ── Unlocked state ───────────────────────────────────────────────────
  if (rewardUnlocked) {
    return (
      <div className="rounded-2xl overflow-hidden shadow-card border border-primary/20 bg-white">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-teal-600 px-6 py-8 text-center text-white">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Gift size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold mb-1">🎉 Reward Unlocked!</h2>
          <p className="text-white/80 text-sm">{businessName}</p>
        </div>

        {/* Reward */}
        <div className="px-6 py-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light text-primary font-bold text-sm mb-4">
            <Star size={14} className="fill-current" />
            Your Reward
          </div>
          <p className="text-xl font-bold text-text-dark mb-4">{rewardDescription}</p>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 font-medium">
            Show this screen to the staff to claim your reward!
          </div>
        </div>

        {/* Points added badge */}
        <div className="px-6 pb-6 text-center">
          <span className="text-xs text-text-light">
            +{pointsAdded} {unit}{pointsAdded !== 1 ? 's' : ''} added · {progress}/{threshold} total
          </span>
        </div>
      </div>
    );
  }

  // ── In-progress state ────────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden shadow-card border border-border-light bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-teal-600 px-6 py-6 text-white">
        <p className="text-white/70 text-xs font-medium mb-1 uppercase tracking-wide">{businessName}</p>
        <h2 className="text-xl font-extrabold">Loyalty Card</h2>
      </div>

      {/* Progress */}
      <div className="px-6 py-6 space-y-4">

        {/* Points added flash */}
        <div className="flex items-center justify-between">
          <span className="text-text-medium text-sm">Progress</span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
            +{pointsAdded} {unit}{pointsAdded !== 1 ? 's' : ''} earned!
          </span>
        </div>

        {/* Progress bar */}
        <ProgressBar value={pct} height="lg" animate />

        {/* Progress counter */}
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-extrabold text-text-dark">
            {progress}
            <span className="text-lg font-medium text-text-light">/{threshold}</span>
          </span>
          <span className="text-sm text-text-medium">
            {campaignType === 'visit_based' ? 'stamps' : 'points'}
          </span>
        </div>

        {/* Reward description */}
        <div className="rounded-xl bg-primary-light px-4 py-3">
          <div className="flex items-start gap-2">
            <Gift size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-primary mb-0.5">
                {remaining} {unit}{remaining !== 1 ? 's' : ''} to go
              </p>
              <p className="text-xs text-primary/80">{rewardDescription}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
