# Design System Foundation — Design Spec

**Date:** 2026-07-12
**Repo:** `letloyal-production` (letloyal.in)
**Phase:** 0 of the full-platform redesign (marketing site, merchant portal, customer portal, admin panel each follow as their own phase)

## Context

LetLoyal is being transformed into a premium loyalty SaaS product. Before any surface is redesigned, this phase establishes the shared foundation: color tokens, a typography scale, an accessible component library, and dark-mode infrastructure. Every later phase consumes this foundation instead of inventing its own patterns.

**Brand direction decided:** "Teal & Honey" — the live teal L+arrow logo *mark* stays exactly as-is; the wordmark font next to it changes from Plus Jakarta Sans to Manrope. Synthesized from four reference designs the founder supplied (Dinoset, Guesty, Coca, Bitepoint) and approved via mockup iteration: dark green hero sections, sage-tinted warm neutrals, deep teal as the workhorse brand colour, honey gold as the reward accent, pill navigation, generously rounded cards. Reference mockup: `Teal & Honey v1 (Manrope)` artifact. The unused "tile + reward dot" concept from `D:/LetLoyal/logo.zip` is rejected.

## Goals

1. One token system (color, type, spacing, radius, shadow) defined once, consumed everywhere.
2. Light **and** dark themes as first-class citizens from day one.
3. An accessible, reusable component library that supersedes the global CSS utility classes in `globals.css`.
4. Existing pages keep their current layout and colours in this phase — the foundation is additive; pages migrate in their own phases. The one intentional visible change is the global font swap (see §2).

## Non-Goals (explicitly out of scope)

- Changes to the logo *mark* (the L+arrow icon geometry and its colors). The wordmark font swap (Jakarta → Manrope) is in scope.
- Redesigning any actual page or route.
- Backend/API/database changes.
- New product features.
- Touching or reverting the QA remediation work.
- Wiring the theme toggle into nav headers (each surface's phase does that).

## 1. Color Tokens ("Teal & Honey")

### Brand colours

Two brand colours with strictly separated jobs:

- **Teal — the workhorse.** Primary actions, links, focus rings, selected states, chart primaries. Light mode `#0B7C6C` (hover `#0A5F53`, subtle `rgba(11,124,108,.09)`); dark mode brightened to `#2CBFA9` (hover `#5EEAD4`). The logo mark's own `#0D9488`/`#5EEAD4` stay untouched inside `Logo.tsx` and sit naturally in this family.
- **Honey gold — the reward metal.** `#F2B824` (deep `#8A6410` for text-on-light, soft `#FBF0CE`; dark mode `#F2C230`/`#F5D269`). Reserved for reward semantics: "Reward due" badges, redemption lines in charts, reward banners/callouts, the active sidebar item, and the primary marketing CTA. Honey is never a generic accent — if it isn't about a reward or the single most important action, it's teal or neutral.

### Neutral scale

Replace the current 3-shade text system (`text.dark/medium/light`) and single border colour with a 10-step **sage-tinted warm neutral scale** (`neutral-50` … `neutral-900`), green-biased to harmonize with teal — light surfaces `#F4F6F2` page / `#FFFFFF` card / `#ECF0EA` well, ink `#17201D`, borders `#E0E6DD`/`#C9D2C5`. Dark theme is green-tinted rather than grey-black: `#0F1513` page / `#161E1B` card / `#1C2622` well, text `#EDF2EE`/`#9BABA2`/`#647169`, borders `#25322D`/`#37473F`.

### Dark marketing sections

Marketing surfaces (hero bands, footers) use a deeper green-ink `#0E1A17` with subtle radial teal/honey glows — a distinct token set (`--section-dark-*`) so product UI and marketing hero don't share surface tokens.

### Semantic colors

`success` `#1E7A4C`/`#4ADE94`, `error` `#B3382E`/`#F0716C`, plus `warning` and `info` — each defined as a light-mode/dark-mode pair (foreground + subtle background variants), replacing today's flat single hexes. Warning is distinct from honey gold (warning communicates caution; honey communicates reward).

### Token architecture

- CSS custom properties in `globals.css` are the single source of truth:
  - Role-based tokens: `--surface-1`, `--surface-2`, `--surface-3`, `--border`, `--border-strong`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--accent`, `--accent-hover`, `--accent-subtle`, plus semantic tokens.
  - Light values on `:root`.
  - Dark values under **both** `@media (prefers-color-scheme: dark)` (scoped to `:root:not([data-theme="light"])`) **and** `:root[data-theme="dark"]` — OS preference works by default, manual toggle always wins in both directions.
- `tailwind.config.ts` maps utility names to `var(--token)` (e.g. `bg-surface-1`, `text-primary`, `border-default`) instead of hardcoded hex. Components written with token classes are automatically theme-correct.
- All token pairings must meet WCAG 2.1 AA contrast (4.5:1 body text, 3:1 large text/UI components) in both themes.

## 2. Typography

Three faces, chosen through the font audition (F1 selected):

- **Manrope** — display: headings, stat values, the LetLoyal wordmark, buttons where weight matters. Weights 500–800, tight tracking (-.02 to -.03em) at display sizes.
- **Figtree** — body/UI: paragraphs, labels, table cells, inputs. Weights 400–700.
- **Fraunces (italic)** — marketing flourish only: a single italic-serif phrase inside hero headlines (e.g. "keep *coming back.*"), usually in honey. Never used in product UI.

This replaces Plus Jakarta Sans + Inter everywhere, including the wordmark in `Logo.tsx` (the SVG mark itself is untouched).

- Add a named type scale to `tailwind.config.ts` — `display`, `h1`, `h2`, `h3`, `h4`, `body-lg`, `body`, `body-sm`, `caption`, `label` — each a fixed size/line-height/letter-spacing/weight tuple, exposed as composite utilities.
- The scale replaces ad hoc `text-3xl font-bold`-style combinations in future work; existing pages keep their current classes until their own migration phase.
- Fonts load via `next/font` (self-hosted, zero layout shift), replacing the render-blocking Google Fonts `@import` in `globals.css`. Because the font families change, existing pages *will* render in the new faces once the swap lands — this is the one intentional visible change in this phase, and it's a font-for-font swap with no layout/colour changes. (Fallback stacks keep metrics close: Manrope↔Jakarta and Figtree↔Inter are near-metric neighbours.)

## 3. Component Library

### Dependencies added

- `@radix-ui/react-*`: Dialog, Dropdown Menu, Tabs, Select, Tooltip, Popover, Switch, Checkbox, Radio Group, Toast
- `class-variance-authority` (CVA)
- (Existing `clsx` + `tailwind-merge` kept; a `cn()` helper added if not present.)

### Components built in `src/components/ui/`

| Component | Base | Variants (CVA) |
|---|---|---|
| Button | native + Slot | intent: primary / secondary / ghost / destructive; size: sm / md / lg; loading state |
| Input, Textarea | native | size; invalid state |
| Select | Radix Select | size |
| Checkbox, Radio, Switch | Radix | — |
| Badge | native | intent: neutral / success / warning / error / teal / reward (honey) |
| Card | native | padding scale; interactive (hover) variant |
| Table | native | density: comfortable / compact |
| Dialog, Drawer | Radix Dialog | size |
| Tabs | Radix Tabs | style: underline / pill |
| Tooltip, Popover | Radix | — |
| Toast | Radix Toast | intent |
| Skeleton | native | shape: text / rect / circle |
| EmptyState | composite | with icon, title, description, optional action |

All components: token-driven styling (both themes free), Radix-provided keyboard/focus/ARIA behavior, `forwardRef`, typed props.

### Design language (shape & depth)

Per the approved Teal & Honey v1 mockup: buttons and nav chips are **pill-shaped** (`border-radius: 999px`); cards and panels use 16px radius; inner elements (inputs, table header wells) 8–11px; badges always pill. Shadows are soft and low (`0 1px 2px` + `0 8px 24px` at ~6% ink) — elevation comes mostly from borders on the sage neutrals, not heavy drop shadows. The sidebar's active item is a honey-filled pill; primary marketing CTA is honey, primary product actions are teal.

### Relationship to existing global classes

`.btn-primary`, `.card`, `.form-input`, badge classes etc. in `globals.css` remain untouched and functional — existing pages keep working. They are deprecated in place (comment marking them as superseded) and get removed only after the last consuming surface has migrated.

## 4. Theme Switching

- `ThemeProvider` (client component) + inline blocking script in root layout `<head>` that reads `localStorage("theme")`, falls back to `prefers-color-scheme`, and stamps `data-theme` on `<html>` before first paint — no flash of wrong theme.
- `ThemeToggle` component built in this phase; wired into surfaces in their own phases.
- Until a surface migrates to token classes, its pages render identically in both themes (they use hardcoded colors), so shipping the toggle mechanism early is safe.

## 5. Verification

- `npm run build` passes; no TypeScript or lint errors.
- A dev-only `/design-system` preview route renders every component in every variant in both themes for visual QA (excluded from production nav/sitemap; acceptable to gate behind `NODE_ENV !== 'production'` — note the client-bundle gotcha: any gating must not leak server-only modules into client components).
- Contrast checks for all token pairs in both themes (documented in the plan as a checklist).
- Existing pages screenshot-compared before/after the font swap to confirm the only difference is the typeface (no layout breaks, no text overflow from metric differences).

## Deployment

Standard flow: commit + push to GitHub (`Jaison650/letloyal-production`), deploy via `./deploy.sh` on the VPS. This phase can ship to production safely at any point: it adds unused infrastructure plus one visible change (the font swap), which is intentionally approved for production.
