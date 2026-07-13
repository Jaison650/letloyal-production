# Marketing Site Redesign ("Teal & Honey" Phase 1) — Design Spec

**Date:** 2026-07-13
**Repo:** `letloyal-production` (letloyal.in)
**Phase:** 1 of the platform redesign. Depends on the shipped Phase 0 foundation (tokens, `next/font`, `src/components/ds/`).

## Context

The design-system foundation is live. This phase applies the approved Teal & Honey language to the public marketing surface: the homepage (the entire acquisition funnel — there is no pricing/features page) and the five legal/policy pages. Reference: the approved mockup (dark green-ink hero, pill nav, honey CTA, Fraunces italic flourish) and the spec at `docs/superpowers/specs/2026-07-12-design-system-foundation-design.md`.

## Goals

1. Homepage visibly carries the new brand: dark hero band, honey primary CTA, token-driven colour everywhere.
2. Homepage decomposed from one 391-line file into section components — each independently editable.
3. Legal pages share the same nav/footer and typographic shell.
4. Copy refreshed to the mockup's voice; every factual claim stays truthful (no invented numbers).
5. Zero URL/anchor changes; SEO metadata and JSON-LD preserved.

## Non-Goals

- New pages (pricing, features, blog) — the pilot has no public pricing.
- Theme toggle on marketing pages (marketing is fixed-light with dark bands as design elements; the toggle is for the portals in later phases).
- Merchant/customer portal or admin changes.
- Backend/API/DB changes.
- Hindi/localisation.

## Architecture

**Approach B — section components.** No route changes.

```
src/components/marketing/
  MarketingNav.tsx        ← replaces homepage use of HomeNav (HomeNav stays until legal pages migrate, then deleted)
  MarketingFooter.tsx     ← extracted from page.tsx footer JSX
  LegalLayout.tsx         ← nav + prose shell + footer for the 5 legal pages
  sections/
    Hero.tsx
    SocialProof.tsx       ← merchant-type marquee strip
    Problem.tsx           ← "paper stamp cards" 3-card section (lucide icons replace emoji)
    HowItWorks.tsx        ← 3 steps (existing STEPS content, tightened)
    Features.tsx          ← 6 features grid (existing FEATURES content)
    CampaignTypes.tsx     ← visit-based (teal) vs spend-based (honey/reward) model cards
    LiveDemo.tsx          ← 6 DEMO_MERCHANTS cards on a dark band (existing /merchant/login links kept)
    Testimonials.tsx      ← existing 3 testimonials verbatim (real quotes — do not rewrite)
    Faq.tsx               ← wraps existing FaqAccordion, re-tokened
    FinalCta.tsx          ← dark band CTA
```

`MarketingNav` takes a `tone` prop: `onDark` (homepage — glassy over the dark hero, switching to light on scroll) or `light` (legal pages — always the light scrolled style). HomeNav is deleted once the homepage switches (no other importers).

`src/app/page.tsx` becomes a ~30-line composition of these sections. Data constants (`DEMO_MERCHANTS`, `FEATURES`, `STEPS`, `TESTIMONIALS`) move into their consuming section files. The `FadeUp` motion helper moves to `src/components/marketing/motion.tsx` and is shared.

All styling uses Phase-0 tokens and `@/components/ds` primitives. No hardcoded hex except the per-merchant brand colours in `DEMO_MERCHANTS` (they represent third-party brands, not ours).

## Visual design (per approved mockup)

- **Nav:** sticky; on the dark hero it renders glassy (white/8% pill links, glass "Merchant login", honey "Get started free"); after scroll it switches to `bg-surface-1/85` blur with ink text. Mobile keeps the existing hamburger pattern, re-tokened. Logo `variant` switches dark→light with scroll state.
- **Hero:** `--section-dark` band with the mockup's radial teal + faint honey glows. Kicker pill (mint on teal-subtle). Headline Manrope 800, `text-display`, with Fraunces italic honey flourish. Sub in `#AEBDB5`-equivalent token (`text-ink-sub` on dark = use explicit dark-band tokens, see below). CTAs: honey pill (lg) + glass pill. Below: the existing "live dashboard" demo card, restyled with ds Card/Badge on a dark glass panel.
- **Dark-band tokens:** dark bands are theme-independent, so sections use a small fixed palette defined once in `MarketingFooter`/`Hero` via Tailwind arbitrary values from the section-dark family (`bg-section-dark`, white/opacity text). Acceptable because these bands look identical in both themes by design.
- **Body sections:** alternate `bg-surface-page` / `bg-surface-1`. Cards are ds `Card` (16px radius, `shadow-ds`). Step numbers in Manrope 800 `text-teal`. Feature icons in `bg-teal-subtle text-teal` squircles; the reward-related feature ("Visit & Spend Campaigns") uses `bg-reward-subtle text-reward-deep` — honey only where reward-meaning exists.
- **LiveDemo cards:** keep per-merchant colour as the card accent; reward line gets a `Badge intent="reward"`.
- **Testimonials:** ds Cards with Fraunces italic pull-quote marks in honey.
- **FAQ:** FaqAccordion re-tokened (borders `stroke`, open state `text-teal`).
- **FinalCta + Footer:** single continuous dark green-ink band; footer columns (Product / Company / Legal), `Logo variant="dark"`, caption text in low-emphasis white.

## Copy

- Headline: `Customers who keep <em>coming back.</em>` (em = Fraunces italic honey)
- Sub: "One QR at your counter. Points land instantly, rewards redeem themselves, and your regulars become your growth engine."
- Primary CTA: "Start free — 2 min setup" → `/merchant/register`. Secondary: "See how it works" → `#how-it-works`.
- Proof line: **"Trusted by merchants across India"** (current truthful claim; no invented counts). Kicker pill: "QR-simple loyalty · no app needed".
- Section copy: tightened versions of existing STEPS/FEATURES text; TESTIMONIALS verbatim (real people).
- All CTAs keep their current destinations (`/merchant/register`, `/merchant/login`, `/my-rewards`, `/s/[slug]`).

## Legal pages

`LegalLayout` wraps the 6 pages (`cookie-policy`, `privacy-policy`, `terms-of-service`, `merchant-terms`, `merchant-rights`, `customer-policy`): MarketingNav (scrolled state), a `max-w-3xl` prose column (`text-ink` headings in Manrope, `text-ink-sub` body, token links), MarketingFooter. Page content markup untouched beyond swapping the wrapper.

## Verification

- `npm run build` + lint clean.
- Browser sweep at mobile (375), tablet (768), desktop (1280): hero, nav scroll transition, mobile menu, all anchors (`#how-it-works`, `#faq`), every CTA destination, demo-card links, legal pages.
- No console errors; no layout overflow at 375px.
- Contrast: dark-band text pairs added to `scripts/check-contrast.mjs` (white-on-section-dark, mint-kicker-on-dark, honey-CTA pairs).
- Deploy via GitHub-first flow only after user approval; service-worker one-visit-stale caveat applies.
