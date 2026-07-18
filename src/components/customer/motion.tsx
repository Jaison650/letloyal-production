'use client';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

/** Animated +N ticker (ease-out cubic, rAF, reduced-motion safe). */
export function CountUp({ to, prefix = '+', duration = 600, className }: {
  to: number; prefix?: string; duration?: number; className?: string;
}) {
  const reduce = useReducedMotion();
  const [val, setVal] = useState(reduce ? to : 0);
  const raf = useRef(0);
  useEffect(() => {
    if (reduce) { setVal(to); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to, duration, reduce]);
  return <span className={className}>{prefix}{val}</span>;
}

/** Progress bar that animates scaleX from `from` (or 0) to `fraction` on mount/update. GPU-only. */
export function AnimatedProgress({ fraction, from, rewardReady, className, trackClassName }: {
  fraction: number; from?: number; rewardReady?: boolean; className?: string; trackClassName?: string;
}) {
  const reduce = useReducedMotion();
  const target = Math.max(0, Math.min(1, fraction));
  const [scale, setScale] = useState(reduce ? target : Math.max(0, Math.min(1, from ?? 0)));
  useEffect(() => {
    if (reduce) { setScale(target); return; }
    const id = requestAnimationFrame(() => setScale(target));
    return () => cancelAnimationFrame(id);
  }, [target, reduce]);
  return (
    <div className={cn('h-2.5 rounded-full bg-surface-2 overflow-hidden', trackClassName)}>
      <div
        className={cn(
          'h-full w-full rounded-full origin-left',
          rewardReady ? 'bg-reward' : 'bg-teal',
          !reduce && 'transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
          className
        )}
        style={{ transform: `scaleX(${scale})` }}
      />
    </div>
  );
}

/** Goal-gradient copy: achievement framing below 50%, countdown framing at/above. */
export function progressCopy(progress: number, threshold: number, unit: string, reward: string): string {
  if (threshold <= 0) return '';
  if (progress >= threshold) return `Reward unlocked — ${reward}`;
  const remaining = threshold - progress;
  return progress / threshold >= 0.5
    ? `${remaining} ${unit}${remaining === 1 ? '' : 's'} to go — ${reward} is close!`
    : `${progress} of ${threshold} ${unit}s`;
}
