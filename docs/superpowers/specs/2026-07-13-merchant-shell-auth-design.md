# Merchant Portal Shell + Auth Redesign ("Teal & Honey" Phase 2a) — Design Spec

**Date:** 2026-07-13
**Repo:** `letloyal-production` (letloyal.in)
**Phase:** 2a of the platform redesign. Depends on Phase 0 (tokens, `src/components/ds/`). Phase 2b (the 9 workflow pages + heavy components) follows as its own spec.

## Context

Phases 0–1 are live (design-system foundation; marketing site). This phase brings the merchant-facing frame into the Teal & Honey language: the portal shell every merchant page sits in, the dashboard home page, and the five auth pages. Reference visual: the approved v1 mockup's merchant console (honey-filled active nav pill, KPI cards, honey reward callout).

## Goals

1. `DashboardShell` fully token-driven — the frame of all 11 portal pages carries the new brand.
2. Dashboard home (`/m/[slug]/page.tsx`) restyled: KPI cards, honey insights callout, ds Table for recent visits.
3. Five auth pages (`/merchant/login|register|forgot|reset|verify-email`) share a new `AuthShell` with a premium two-column layout.
4. **Presentation-only**: zero changes to queries, API routes, auth logic, redirects, or form field names/validation.

## Non-Goals

- The 9 workflow pages (`campaign`, `offers`, `qr`, `analytics`, `validate`, `feedback`, `push`, `settings`, `customers`, `redeem`) and their components (QRPanel, InsightsClient, ProfileEditor, CampaignForm, RedemptionValidator, FeedbackList) — Phase 2b.
- Mounting the ThemeToggle. The shell becomes dark-ready via tokens, but the toggle ships in 2b when every portal page is tokenized (otherwise dark sidebar + light legacy pages).
- Customer portal, admin, backend, DB.
- New features, nav reordering, or renaming nav items.

## Design

### 1. DashboardShell (`src/components/merchant/DashboardShell.tsx` — restyle in place)

Structure unchanged (desktop sidebar / mobile drawer + top bar / main). Class-level changes only:

- Sidebar: `bg-surface-1 border-r border-stroke`. Merchant logo block keeps `MerchantMark` (letter-avatar fallback becomes `bg-teal-subtle text-teal`); business name `text-ink`.
- Nav items: active = **honey pill** `bg-reward text-reward-fg font-bold rounded-full`; inactive = `text-ink-sub hover:bg-surface-2 hover:text-ink rounded-full`. (Pill shape per design language; was rounded-xl teal-filled.)
- Sign out: `text-ink-sub hover:bg-bad-subtle hover:text-bad`.
- Mobile top bar & drawer: `bg-surface-1 border-stroke`, overlay unchanged.
- Content: `bg-surface-page`, main padding unchanged.
- `PoweredBy` stays at sidebar bottom.

### 2. AuthShell (`src/components/merchant/AuthShell.tsx` — new)

Shared by all five auth pages:

- Desktop (`lg:`): two columns. Left 45%: dark brand panel — `bg-section-dark` with the marketing hero's radial teal glow, `Logo variant="dark"` at top, tagline "Loyalty that brings them back." (Manrope + Fraunces italic honey on "back"), small footer line "© 2026 LetLoyal". Right 55%: form area centered on `bg-surface-page`.
- Mobile: single column, `Logo variant="light"` centered above the form card.
- Form card: ds `Card` (`max-w-md`), `font-display` h1, `text-ink-sub` helper text.
- Props: `{ title, subtitle?, children, footer? }` — footer for the "Don't have an account? →" style links (`text-teal font-semibold`).

### 3. Auth pages (5 × restyle in place)

Each page keeps its exact form state, field names, validation, fetch calls, error/success handling, and redirect targets. Swaps only:

- Wrapper JSX → `AuthShell`.
- `.form-input`/inline inputs → ds `Input` (with `invalid` prop bound to existing error state where present).
- Primary buttons → ds `Button` (`intent="primary"` teal for login/forgot/reset/verify actions; `intent="reward"` honey for register's "Create account" — acquisition CTA matches marketing).
- Inline error/success text → `text-bad` / `text-good` with existing message strings.
- Links → `text-teal font-semibold hover:underline`.

### 4. Dashboard home (`src/app/m/[slug]/page.tsx` — restyle in place)

Server component; all four queries and helpers unchanged. Presentation:

- `StatCard` → KPI card: ds-Card look (`border-stroke rounded-[16px] shadow-ds`), teal icon squircle (`bg-teal-subtle text-teal`), value in `font-display font-bold [font-variant-numeric:tabular-nums] text-ink`, label `text-label uppercase text-ink-faint`. Colored top-border variants removed.
- Insights list ("close to reward" / "pending redeem") → **honey callout card**: `bg-reward-subtle border border-[--reward] /40 rounded-[16px]`; pending-redeem rows get `Badge intent="reward"`, close-to-reward rows `Badge intent="teal"`.
- Recent visits → ds `Table` (`THead/TH/TBody/TR/TD`), phone masked as today, `timeAgo` unchanged.
- Campaign panel → ds Card with teal progress bar (`bg-teal`, track `bg-surface-2`), honey fill when `progress >= threshold`.
- Quick-action links (`/m/[slug]/qr` etc.) → ds `Button intent="secondary" size="sm"` or ghost, destinations unchanged.
- `LiveClock` untouched.

### 5. Legacy class cleanup

Pages in scope stop using `.card`, `.btn-primary`, `.form-input`; the classes themselves stay in `globals.css` (other surfaces still consume them — removal happens after the last migration, per the foundation spec).

## Verification

- `npm run build` + lint; `npm run check:contrast` (no new colour pairs expected — all tokens).
- Browser sweep (dev, seeded demo merchant `brewhouse-cafe` / seed credentials):
  - Login with demo credentials → lands on dashboard; wrong password shows error state in new styling.
  - Dashboard renders live data: KPIs, campaign progress, recent visits table, insights callout.
  - All 9 sidebar links route; active pill tracks the current page; legacy pages still render fine inside the new shell.
  - Mobile 375px: drawer opens/closes, no overflow.
  - Register/forgot/reset/verify pages render in AuthShell (visual check; no live email flows needed).
- Deploy via GitHub-first flow only after user approval.
