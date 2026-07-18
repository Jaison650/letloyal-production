'use client';
import { CheckCircle2 } from 'lucide-react';
import { Card, Badge } from '@/components/ds';
import { CountUp, AnimatedProgress, progressCopy } from './motion';

export default function EarnResult({ pointsAdded, progress, threshold, rewardUnlocked, rewardDescription, businessName, unit = 'visit' }: {
  pointsAdded: number; progress: number; threshold: number;
  rewardUnlocked: boolean; rewardDescription: string; businessName: string; unit?: string;
}) {
  const prev = Math.max(0, progress - pointsAdded);
  const nearGoal = threshold > 0 && progress / threshold >= 0.75 && !rewardUnlocked;
  return (
    <Card padding="lg" className="text-center animate-pop-in">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-good-subtle text-good">
        <CheckCircle2 size={26} />
      </div>
      <p className="text-body-sm text-ink-sub">{businessName}</p>
      <p className="my-2 font-display text-4xl font-extrabold text-ink [font-variant-numeric:tabular-nums]">
        <CountUp to={pointsAdded} className={rewardUnlocked ? 'text-reward-deep' : 'text-teal'} />
      </p>
      <AnimatedProgress fraction={threshold > 0 ? progress / threshold : 0} from={threshold > 0 ? prev / threshold : 0} rewardReady={rewardUnlocked} className="mx-auto" trackClassName="max-w-[240px] mx-auto" />
      <p className="mt-3 text-body-sm font-semibold text-ink-sub [font-variant-numeric:tabular-nums]">
        {progress} / {threshold}
      </p>
      {rewardUnlocked ? (
        <div className="relative mt-4 overflow-hidden rounded-[11px] border border-reward/40 bg-reward-subtle px-4 py-3">
          <span aria-hidden className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-x" />
          <Badge intent="reward">Reward unlocked</Badge>
          <p className="mt-1.5 font-display font-bold text-reward-deep">{rewardDescription}</p>
        </div>
      ) : nearGoal ? (
        <p className="mt-4 text-body font-bold text-reward-deep">
          Only {threshold - progress} more to unlock {rewardDescription}!
        </p>
      ) : (
        <p className="mt-4 text-body-sm text-ink-faint">{progressCopy(progress, threshold, unit, rewardDescription)}</p>
      )}
    </Card>
  );
}
