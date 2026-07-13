# Merchant Workflow Pages + Theme Toggle ("Teal & Honey" Phase 2b) — Design Spec

**Date:** 2026-07-13
**Repo:** `letloyal-production` (letloyal.in)
**Phase:** 2b — completes the merchant portal. Depends on Phase 0 (tokens/ds) and 2a (AuthShell, re-tokened DashboardShell + dashboard home).

## Context

After 2b every merchant-facing screen is token-driven, which is the precondition for mounting the theme toggle. The heavy work is in six components (`InsightsClient` 636 lines/96 legacy-class hits, `QRPanel` 672/43, `ProfileEditor` 438/26, `CampaignForm` 391/22, `RedemptionValidator` 270/22, `FeedbackList` 139/12) plus the `push` (337/32), `validate` (249/19), and `offers` (199/14) pages; the remaining `/m/[slug]/*` pages are thin wrappers.

## Goals

1. All 10 remaining portal pages + 6 merchant components re-tokened, presentation-only.
2. ThemeToggle mounted in DashboardShell (sidebar footer, desktop + mobile drawer); `ThemeProvider` wraps the portal layout only.
3. Chart/graph colours in `InsightsClient` follow the language: teal series, honey reserved for redemption metrics, token gridlines.
4. Honey = reward-meaning only, everywhere (redemption stats, unlocked states); operation success/failure = `good`/`bad`.

## Non-Goals

- Marketing, auth pages (fixed light), customer portal, admin.
- Any logic change: QR generation/download/print, OTP validation, campaign mutation, push subscription, profile upload flows are untouched.
- New features, chart library adoption, layout rearchitecture.
- Removing legacy `globals.css` classes (still consumed by customer/admin surfaces; removal after the last phase).

## Design

### Re-token order (risk-ascending; one commit per step)

1. **Thin pages:** `settings`, `campaign`, `feedback`, `redeem`, `customers`, `analytics`, `qr` wrappers — plus `offers`, `validate`, `push` full pages. Standard mapping (same table as 2a): `.card`→ds `Card` or token classes, `btn-*`→ds `Button` intents, `form-input`→ds `Input`/`AuthField` pattern, `text-text-*`→`ink` scale, `border-border-light`→`stroke`, `bg-bg-muted`→`surface-page`/`surface-2`, `bg-primary`→`teal`, red/emerald/amber ad-hoc states→`bad`/`good`/`reward` semantics.
2. **FeedbackList, CampaignForm, ProfileEditor:** forms adopt ds field styling. Native `<select>` elements get ds `Select` ONLY if currently custom-styled; plain native selects keep native behaviour with token classes. File inputs / upload zones re-token borders + text only.
3. **RedemptionValidator:** business-critical OTP flow — strictest diff check; the OTP input uses the exact verify-email treatment (`tracking-widest text-center font-bold`, `focus:border-teal focus:shadow-ring`); success state `good`, invalid `bad`, the unlocked-reward presentation honey.
4. **QRPanel:** all surrounding UI (tabs, controls, preview frame, download/print buttons) re-tokens; the QR SVG/canvas rendering, colour pickers' output values, and download/print handlers are byte-identical.
5. **InsightsClient:** hand-rolled charts re-map — primary series `--accent-default` (teal), redemption series honey `#F2B824`, comparison/secondary `ink-faint`, gridlines `stroke`/`surface-2`, axis labels `ink-faint`. Stat tiles use the 2a KPI card pattern.

### Theme toggle

- `src/app/m/[slug]/layout.tsx` wraps children in `ThemeProvider` (from `@/components/ds`).
- `DashboardShell` sidebar footer gains `<ThemeToggle />` beside Sign Out (both desktop sidebar and mobile drawer footer).
- Marketing/auth surfaces remain outside the provider and keep `data-theme`-independent fixed styling (they already are — dark bands are fixed palettes; light sections use tokens whose dark values only apply under `data-theme='dark'`, which those pages can now receive if the merchant toggled dark — **check**: tokens are global on `:root`. A merchant who sets dark and then visits the marketing homepage would see token-driven marketing sections flip dark. Marketing sections were built token-driven in Phase 1, and were contrast-checked in both themes at the token level — acceptable and actually correct behaviour: the site respects the user's chosen theme. Auth pages are also token-driven; their dark render must be visually verified in this phase.)

### Verification

- Local: `npm run build`, `npx tsc --noEmit`, lint, `npm run check:contrast`; behaviour-preservation diff scan per file (no changed lines matching `fetch(|router\.|useState|useEffect|handler names|canvas|toDataURL|navigator\.`).
- Live (post-deploy, demo merchant `spice-junction`): logged-in sweep of all 11 portal pages in light AND dark; toggle persists across reloads; QR download still produces a valid file; validate page accepts a bad OTP gracefully (error state); marketing + auth pages eyeballed in dark since tokens are global.
- Rollback plan: revert the 2b commits + redeploy (zero-downtime) if any live page misrenders.

## Deployment

GitHub-first; deploy gated on user approval. PWA one-stale-visit caveat applies.
