# Design System Foundation — Design Spec

**Date:** 2026-07-12
**Repo:** `letloyal-production` (letloyal.in)
**Phase:** 0 of the full-platform redesign (marketing site, merchant portal, customer portal, admin panel each follow as their own phase)

## Context

LetLoyal is being transformed into a premium loyalty SaaS product. Before any surface is redesigned, this phase establishes the shared foundation: color tokens, a typography scale, an accessible component library, and dark-mode infrastructure. Every later phase consumes this foundation instead of inventing its own patterns.

**Brand direction decided:** Option A — keep the live teal L+arrow mark (`src/components/ui/Logo.tsx`) exactly as-is. The redesign is a refinement around the existing logo, not a rebrand. The unused "tile + reward dot" concept from `D:/LetLoyal/logo.zip` is rejected.

## Goals

1. One token system (color, type, spacing, radius, shadow) defined once, consumed everywhere.
2. Light **and** dark themes as first-class citizens from day one.
3. An accessible, reusable component library that supersedes the global CSS utility classes in `globals.css`.
4. Zero visual change to existing pages in this phase — the foundation is additive; pages migrate in their own phases.

## Non-Goals (explicitly out of scope)

- Logo changes of any kind (mark, wordmark, colors inside `Logo.tsx`).
- Redesigning any actual page or route.
- Backend/API/database changes.
- New product features.
- Touching or reverting the QA remediation work.
- Wiring the theme toggle into nav headers (each surface's phase does that).

## 1. Color Tokens

### Accent

Teal `#0D9488` remains the single brand accent — the sole carrier of primary actions, links, and focus rings. Mint `#5EEAD4` is reserved for the logo and rare reward/celebration moments. No second brand color is introduced.

### Neutral scale

Replace the current 3-shade text system (`text.dark/medium/light`) and single border color with a 10-step neutral scale (`neutral-50` … `neutral-900`), slate-biased to harmonize with teal. This scale drives surfaces, borders, and text at every hierarchy level, and is what makes credible elevation and dark mode possible.

### Semantic colors

`success`, `warning`, `error`, `info` — each defined as a light-mode/dark-mode pair (foreground + subtle background variants), replacing today's flat single hexes.

### Token architecture

- CSS custom properties in `globals.css` are the single source of truth:
  - Role-based tokens: `--surface-1`, `--surface-2`, `--surface-3`, `--border`, `--border-strong`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--accent`, `--accent-hover`, `--accent-subtle`, plus semantic tokens.
  - Light values on `:root`.
  - Dark values under **both** `@media (prefers-color-scheme: dark)` (scoped to `:root:not([data-theme="light"])`) **and** `:root[data-theme="dark"]` — OS preference works by default, manual toggle always wins in both directions.
- `tailwind.config.ts` maps utility names to `var(--token)` (e.g. `bg-surface-1`, `text-primary`, `border-default`) instead of hardcoded hex. Components written with token classes are automatically theme-correct.
- All token pairings must meet WCAG 2.1 AA contrast (4.5:1 body text, 3:1 large text/UI components) in both themes.

## 2. Typography

- **Fonts unchanged:** Plus Jakarta Sans (headings) + Inter (body). No third typeface.
- Add a named type scale to `tailwind.config.ts` — `display`, `h1`, `h2`, `h3`, `h4`, `body-lg`, `body`, `body-sm`, `caption`, `label` — each a fixed size/line-height/letter-spacing/weight tuple, exposed as composite utilities.
- The scale replaces ad hoc `text-3xl font-bold`-style combinations in future work; existing pages keep their current classes until their own migration phase.
- Font loading moves from the render-blocking Google Fonts `@import` in `globals.css` to `next/font` (self-hosted, zero layout shift). This is the one change in this phase that touches existing pages — visual output is identical, delivery mechanism improves.

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
| Badge | native | intent: neutral / success / warning / error / accent |
| Card | native | padding scale; interactive (hover) variant |
| Table | native | density: comfortable / compact |
| Dialog, Drawer | Radix Dialog | size |
| Tabs | Radix Tabs | style: underline / pill |
| Tooltip, Popover | Radix | — |
| Toast | Radix Toast | intent |
| Skeleton | native | shape: text / rect / circle |
| EmptyState | composite | with icon, title, description, optional action |

All components: token-driven styling (both themes free), Radix-provided keyboard/focus/ARIA behavior, `forwardRef`, typed props.

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
- Existing pages screenshot-compared before/after the `next/font` swap to confirm no visual regression.

## Deployment

Standard flow: commit + push to GitHub (`Jaison650/letloyal-production`), deploy via `./deploy.sh` on the VPS. This phase can ship to production safely at any point since it adds unused infrastructure plus one behavior-identical font-loading change.
