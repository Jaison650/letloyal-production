# Customer Surface Redesign ("Teal & Honey" Phase 3) — Design Spec

**Date:** 2026-07-16
**Repo:** `letloyal-production` (letloyal.in)
**Phase:** 3 — the last customer-facing surface. Depends on Phases 0–2b and the dark-first flip (site default is dark; `[data-theme='light']` is the only override).

## Context

The customer surface is the final light-legacy area and the most mobile-heavy (customers arrive via QR scan on phones). Inventory: `src/app/my-rewards/page.tsx` (1,211-line monolith: customer auth + loyalty cards + rewards + history), `src/components/customer/ScanClient.tsx` (751 lines — the `/s/[slug]` earn flow, revenue-critical), `src/app/p/[slug]/page.tsx` (237), `src/app/customer/reset-password/page.tsx` (128), `FeedbackForm.tsx` (187), `MilestoneCard.tsx` (140).

## Goals

1. `my-rewards` monolith split into section components (mechanical, zero visual change), then re-tokened.
2. All customer screens token-driven → they adopt the site-wide dark default automatically.
3. Wallet-style loyalty cards; honey strictly for unlocked/due rewards; scan confirmation keeps its celebration (canvas-confetti stays).
4. Zero behaviour change in scan/earn, OTP redemption, registration, login, reset flows.

## Non-Goals

- Customer-facing theme toggle (customers get the brand default; only merchants have the toggle).
- New features, API/DB changes, admin surface (Phase 4).
- Removing legacy `globals.css` classes (admin still consumes them; cleanup lands with Phase 4).

## Design

### 1. my-rewards split (Step A — mechanical extraction, zero class changes)

`src/app/my-rewards/page.tsx` (client monolith) extracts by concern into `src/components/customer/`:

- `CustomerAuthPanel.tsx` — login/register/forgot forms + OTP states exactly as they exist in the monolith.
- `LoyaltyCardList.tsx` + `LoyaltyCard.tsx` — the per-merchant cards (logo, progress, reward line).
- `CardDetailView.tsx` — expanded card: history, milestones (hosts existing `MilestoneCard`), redeem action.
- `CustomerProfile.tsx` — profile/account controls if present in the monolith.

The exact split follows the monolith's actual internal structure (the implementation plan derives it from reading the file); rule: state that spans sections stays in `page.tsx` and flows down via props — no state duplication, no behaviour moves. `page.tsx` target ≤ ~200 lines. Extraction commits BEFORE any styling commit and must be visually indistinguishable (same classes, same DOM).

### 2. Re-token (Step B — canonical mapping table from the 2b plan)

Applies to the extracted files + `ScanClient`, `/p/[slug]`, `/s/[slug]` page shell, `reset-password`, `FeedbackForm`, `MilestoneCard`. Established rules: ds `Card`/`Button`/`Badge`/`Input` where props fit; success/error = `good`/`bad` subtle patterns; caution amber → `warn`; reward amber → `reward` tokens; no raw palette colours (dark-readiness).

### 3. Wallet-style loyalty cards

- Card: `bg-surface-1 border border-stroke rounded-[16px] shadow-ds` with a 4px left accent strip in the merchant's brand colour (data value — sanctioned hardcode) and the merchant logo/letter avatar.
- Progress: track `bg-surface-2`, fill `bg-teal`; when `reward_status === 'unlocked'` (or progress ≥ threshold), fill and supporting text switch to reward tokens and the card shows `Badge intent="reward"` ("Reward due"/existing copy).
- Expanded detail keeps existing interactions; milestone visuals re-token (`MilestoneCard`: locked = neutral, reached = teal, claimable = reward).

### 4. Scan flow (`/s/[slug]`, ScanClient)

- Presentation-only re-token of the scan/earn UI; the "+N points" confirmation moment uses reward tokens; canvas-confetti calls, QR/camera handling (`jsqr`), fetch sequence, and OTP redemption logic are byte-identical.
- Strictest per-file scan: no changed lines matching `fetch\(|jsqr|getUserMedia|confetti|OTP|router\.|useState|useEffect` beyond pure className edits.

### 5. Customer auth + reset

Single-column mobile-first forms on `bg-surface-page` using the ds field pattern (AuthField-equivalent inline or reuse if trivially importable — no marketing brand panel). Logo on top, teal primary actions, links `text-teal font-semibold`.

### 6. /p/[slug] merchant profile

Re-token: merchant header (their logo/colour as data), campaign/reward info cards, CTA to scan/join — token classes throughout, honey only on reward lines.

## Verification

- Step A gate: extraction commits pass build/tsc AND a DOM-equivalence spot check (`curl` the rendered page before/after in dev where renderable, plus `git diff` shows only moved JSX, no class edits).
- Step B: canonical scans per file; `npm run check:contrast`; dark-readiness grep.
- Live (post-deploy, demo merchant `spice-junction`): phone-viewport sweep — `/s/[slug]` earn flow end-to-end (register → scan → points land → progress renders), `/my-rewards` login + wallet cards + unlocked-reward honey state, `/p/[slug]`, reset page render; error log quiet.
- Rollback: revert Phase-3 commits + redeploy.

## Deployment

GitHub-first, deploy gated on user approval. PWA one-stale-visit caveat applies (customer pages are the most SW-cached — expect one stale visit per returning customer).
