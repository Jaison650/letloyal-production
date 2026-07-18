# Customer Surface ("Teal & Honey" Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the my-rewards monolith, re-token the entire customer surface into dark-first Teal & Honey, and add the gamified earn/milestone layer — with zero behaviour change and mobile-first verification.

**Architecture:** Two-step: (A) mechanical extraction of `my-rewards/page.tsx` into `src/components/customer/` with ZERO class changes, verified as a pure move; (B) re-token via the canonical mapping table (in `docs/superpowers/plans/2026-07-13-merchant-workflows-theme.md`) plus new shared motion utilities (CountUp, AnimatedProgress, honey ring/shimmer keyframes) powering the gamification. All animation is transform/opacity, one-shot, reduced-motion-safe, no new dependencies.

**Tech Stack:** Next.js 15, Tailwind tokens, `@/components/ds`, framer-motion (existing), canvas-confetti (existing), jsqr (untouched).

**Spec:** `docs/superpowers/specs/2026-07-16-customer-surface-design.md`

**Conventions for every task:**
- Repo `letloyal-production`, branch `master`; commit prefix `cst:`; `npx tsc --noEmit` + `npm run build` before every commit.
- **PRIME RULE:** zero behaviour change. Per-file scan after edits: `git diff <file> | grep "^[-+]" | grep -E "fetch\(|router\.|useState|useEffect|jsqr|getUserMedia|confetti|OTP|localStorage|geolocation"` — only symmetric moves (Task A) or empty (Task B) allowed; investigate any asymmetry.
- **Mobile-first:** every visual check runs at 375×812 FIRST; touch targets ≥44px; inputs keep 16px font. Desktop = centered `max-w-md` (existing layout pattern) checked second.
- Dark-readiness rule and canonical mapping table from the 2b plan apply to every re-token step.
- Do NOT push before the final gate. Do NOT modify `src/components/ds/*`, `QRScanner.tsx` internals (camera logic), or API routes. `db/schema.sql` and `.claude/launch.json` working-tree changes belong to other sessions — never stage them.

---

### Task 1 (Step A): Extract self-contained helpers + types

**Files:**
- Create: `src/components/customer/my-rewards/types.ts`, `ui.tsx`, `InlineRedeemCode.tsx`, `ActiveOffersBanner.tsx`, `LoyaltyCardItem.tsx`, `DiscoverCard.tsx`, `ProfileField.tsx` (all under `src/components/customer/my-rewards/`)
- Modify: `src/app/my-rewards/page.tsx` (delete moved code, add imports)

- [ ] **Step 1:** Read `src/app/my-rewards/page.tsx` fully. Move VERBATIM (no class/logic edits):
  - Type/interface declarations (lines ~18–35) → `types.ts` (export each).
  - `Spinner` + `MerchantAvatar` → `ui.tsx` (named exports; add `'use client'`).
  - `InlineRedeemCode`, `ActiveOffersBanner`, `LoyaltyCardItem`, `DiscoverCard`, `ProfileField` → one file each, default export, `'use client'`, importing types from `./types` and shared bits from `./ui`.
  - In `page.tsx`: replace the moved code with imports. NOTHING else changes.
- [ ] **Step 2:** tsc + build → PASS. Verify pure-move: `git diff src/app/my-rewards/page.tsx | grep "^+" | grep -v "^+++" | grep -v "^+import"` shows nothing but import lines.
- [ ] **Step 3:** Commit: `cst: extract self-contained my-rewards helpers (pure move)`.

### Task 2 (Step A): Extract AuthPanel, TabBar, and the four tab components

**Files:**
- Create: `src/components/customer/my-rewards/AuthPanel.tsx`, `TabBar.tsx`, `CardsTab.tsx`, `ScanTab.tsx`, `NearbyTab.tsx`, `AccountTab.tsx`
- Modify: `src/app/my-rewards/page.tsx`

- [ ] **Step 1:** Extract each JSX region VERBATIM into a prop-driven component; state/handlers STAY in `page.tsx` and pass down. Regions (line refs pre-Task-1, adjust after):
  - `phase === 'login'` return block (~599–833) → `AuthPanel` (props: every identifier the block references — authMode, phone, name, email, password, showPw, analyticsOptIn, forgotEmail, forgotSent, error, fetching + their setters + submit/oauth handlers; list them exactly from the code).
  - Bottom tab bar (~1185+) → `TabBar` (props: `tab`, `setTab`).
  - `tab === 'cards'` content → `CardsTab`; `tab === 'scan'` → `ScanTab`; `tab === 'nearby'` → `NearbyTab`; `tab === 'account'` → `AccountTab` — same prop-derivation rule.
  - `page.tsx` keeps: all state, effects, handlers, loading return, dashboard header/sub-header, tab switch dispatching to the four tab components. Target ≤ ~250 lines.
- [ ] **Step 2:** tsc + build → PASS. Behaviour scan (symmetric moves only). In dev at 375×812: login screen renders identically; (auth-gated content can't be exercised without DB — structural render check only).
- [ ] **Step 3:** Commit: `cst: extract my-rewards auth panel and tab components (pure move)`.

### Task 3: Motion utilities + keyframes

**Files:**
- Create: `src/components/customer/motion.tsx`
- Modify: `src/app/globals.css` (append inside `@layer utilities` or at end)

- [ ] **Step 1:** Create `src/components/customer/motion.tsx`:

```tsx
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
```

- [ ] **Step 2:** Append to `src/app/globals.css` (transform/opacity-only keyframes):

```css
/* ── Phase 3 gamification (transform/opacity only; reduced-motion disabled) ── */
@keyframes ring-honey {
  0%   { transform: scale(0.8); opacity: 0.55; }
  70%, 100% { transform: scale(1.6); opacity: 0; }
}
.animate-ring-honey { animation: ring-honey 2.5s ease-out infinite; }

@keyframes shimmer-x {
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
}
.animate-shimmer-x { animation: shimmer-x 1.8s ease-in-out infinite; }

@keyframes pop-in {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; }
}
.animate-pop-in { animation: pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

@media (prefers-reduced-motion: reduce) {
  .animate-ring-honey, .animate-shimmer-x, .animate-pop-in { animation: none; }
  .animate-pop-in { opacity: 1; transform: none; }
}
```

- [ ] **Step 3:** tsc + build → PASS. Commit: `cst: gamification motion utilities and keyframes`.

### Task 4: EarnResult component (shared gamified scan outcome)

**Files:**
- Create: `src/components/customer/EarnResult.tsx`

- [ ] **Step 1:** Create the shared earn-moment presentation used by both ScanTab and ScanClient (props mirror the existing `scanResult` shape; confetti stays where it already fires in callers):

```tsx
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
```

- [ ] **Step 2:** tsc + build → PASS. Commit: `cst: shared EarnResult gamified scan outcome`.

### Task 5 (Step B): Re-token my-rewards — auth, shell, tabs, helpers + wallet cards + gamified card list

**Files:**
- Modify: everything under `src/components/customer/my-rewards/` + `src/app/my-rewards/page.tsx` (+ `layout.tsx` only if it carries colour classes)

- [ ] **Step 1:** Apply the canonical mapping table to every extracted file and the page shell (header, sub-header, loading state). Auth forms use ds `Input`/`Button` where props fit (same judgement rules as the merchant auth migration); Google OAuth button keeps its own branding but re-tokens its border/text.
- [ ] **Step 2:** `LoyaltyCardItem` becomes the wallet card + gamified:
  - Wrapper: `rounded-[16px] border border-stroke bg-surface-1 shadow-ds overflow-hidden relative pl-4` with an absolute left strip `<span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: card.brand_color ?? 'var(--accent-default)' }} />` (use the card's existing colour field name — read the type).
  - Progress bar → `AnimatedProgress` (`fraction = progress/threshold`, `rewardReady = unlocked state per existing field`), replacing the static bar; supporting line → `progressCopy(...)` with the campaign's unit (visits vs points — derive from the existing conditional copy in the file).
  - Unlocked state: `Badge intent="reward"` + reward-token text (existing redeem interactions unchanged; `InlineRedeemCode` re-tokens with the OTP-style code display: `font-display font-extrabold tracking-widest text-reward-deep`).
- [ ] **Step 3:** `TabBar`: `bg-surface-1 border-t border-stroke`, active tab `text-teal` with a small dot, inactive `text-ink-faint`; ≥44px touch targets. `ScanTab` result block → replace its scanResult JSX with `<EarnResult {...scanResult} businessName={scanResult.business_name} rewardDescription={scanResult.reward_description} rewardUnlocked={scanResult.reward_unlocked} pointsAdded={scanResult.points_added} />` (map prop names exactly; keep the existing confetti call where it fires today). `NearbyTab`/`AccountTab`/`ProfileField`/`DiscoverCard`/`ActiveOffersBanner`: mapping table; offers banner is reward-meaning → reward tokens.
- [ ] **Step 4:** tsc + build → PASS; behaviour scans per file; dark-readiness grep over `src/components/customer/` + the page. Visual check at 375×812 (login screen + structure).
- [ ] **Step 5:** Commit: `cst: re-token my-rewards with wallet cards and gamified earn/cards`.

### Task 6: ScanClient + MilestoneCard + FeedbackForm gamification/re-token

**Files:**
- Modify: `src/components/customer/ScanClient.tsx`, `src/components/customer/MilestoneCard.tsx`, `src/components/customer/FeedbackForm.tsx`

- [ ] **Step 1:** `ScanClient` (751 lines — read fully first): mapping table throughout; its success/result UI adopts `EarnResult` if its result state carries the same fields (map exactly; if its result shape differs materially, re-create the EarnResult composition inline with its fields rather than changing state shape). Camera/jsqr/fetch/OTP logic byte-identical. STRICTEST scan: `fetch\(|jsqr|getUserMedia|confetti|OTP|useState|useEffect` asymmetries = stop.
- [ ] **Step 2:** `MilestoneCard`: mapping table + gamification:
  - Each milestone node wraps in `<div className="animate-pop-in" style={{ animationDelay: \`\${index * 40}ms\` }}>`.
  - States: locked = `bg-surface-2 text-ink-faint border-stroke`; reached = `bg-teal-subtle text-teal border-teal/30`; claimable/next-target gets a sibling ring: `<span aria-hidden className="absolute inset-0 rounded-full border-2 border-reward animate-ring-honey" />` (parent `relative`).
  - Claimable milestone content → reward tokens + `Badge intent="reward"`.
- [ ] **Step 3:** `FeedbackForm`: mapping table; star/rating actives → `text-reward` fill (rating = reward-meaning); submit → ds `Button`.
- [ ] **Step 4:** tsc + build → PASS; scans; dark-readiness grep. Commit: `cst: gamified scan flow and milestones; re-token feedback form`.

### Task 7: /p/[slug], /s/[slug] page shell, reset-password

**Files:**
- Modify: `src/app/p/[slug]/page.tsx`, `src/app/s/[slug]/page.tsx`, `src/app/customer/reset-password/page.tsx`

- [ ] **Step 1:** Mapping table on all three (read first). `/p/[slug]`: merchant colour/logo stay data-driven; reward lines honey; join/scan CTA teal pill. `/s/[slug]` page: shell classes only (ScanClient did the heavy lifting). `reset-password`: ds fields + teal actions, single column, logo on top (no brand panel).
- [ ] **Step 2:** tsc + build → PASS; scans. Commit: `cst: re-token merchant profile, scan shell, reset password`.

### Task 8: Verification + deploy gate

- [ ] **Step 1:** `npm run build && npm run lint && npm run check:contrast` — pass (lint: only pre-existing LocationPicker warning).
- [ ] **Step 2:** Dark-readiness grep over all Phase-3 files (same pattern as the 2b plan Task 8) → empty.
- [ ] **Step 3:** Local mobile sweep at 375×812 (dev server): `/my-rewards` login screen, `/customer/reset-password`, `/p/spice-junction` (if seeded locally, else structural), `/design-system` still fine; `prefers-reduced-motion` emulation shows content without animation.
- [ ] **Step 4: Deploy gate (STOP — user confirmation).** Then push, `./deploy.sh`, PM2 online.
- [ ] **Step 5: Live mobile sweep** (phone viewport, demo customer against `spice-junction`): register/login on `/my-rewards`; scan flow `/s/spice-junction` end-to-end — points land, CountUp + bar animation plays, proximity nudge at ≥75%, unlock shows confetti + shimmer once; wallet cards show accent strip + animated progress + countdown copy; milestones pop in with honey ring on next target; `/p/spice-junction`; reset page. Error log quiet. Rollback = revert + redeploy.

---

## Self-review notes

- **Spec coverage:** §0 mobile-first (conventions + Tasks 5/8), §1 split (T1–2, pure-move verified), §2 re-token (T5–7), §3 wallet cards (T5), §4 scan flow (T6), §4b gamification — count-up/animated bar/nudge (T3–4), milestone pop-in/ring/shimmer (T3/T6), countdown framing (`progressCopy`, T3), performance guardrails (transform/opacity keyframes, reduced-motion in every utility, zero new deps), §5 auth/reset (T5/T7), §6 profile page (T7).
- **Type consistency:** `CountUp`/`AnimatedProgress`/`progressCopy` defined in T3, consumed in T4–6 with matching signatures; `EarnResult` props mirror the monolith's `scanResult` fields observed in the code (`points_added, progress, threshold, reward_unlocked, reward_description, business_name`).
- **Judgement boundaries for executors:** prop lists for extracted components derive from the actual identifiers each JSX block references; ScanClient may keep an inline EarnResult composition if its result shape differs — both rules stated in-task.
