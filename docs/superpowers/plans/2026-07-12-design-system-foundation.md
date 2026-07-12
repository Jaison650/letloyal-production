# Design System Foundation ("Teal & Honey") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Teal & Honey design-system foundation for letloyal.in — colour/type tokens, dark mode, fonts, and an accessible Radix+CVA component library — without changing any existing page except the approved global font swap.

**Architecture:** CSS custom properties in `globals.css` are the single source of truth for colour; `tailwind.config.ts` maps utility names to `var(--token)`. New components live in `src/components/ds/` (NOT `src/components/ui/`, which has legacy components with live importers). Fonts load via `next/font`. A dev-gated `/design-system` route and a contrast-check script are the verification harness — this repo has **no unit-test framework**, so tasks use build/route/script verification instead of TDD test steps.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 3.4, Radix UI primitives, class-variance-authority, clsx + tailwind-merge, next/font (Manrope, Figtree, Fraunces).

**Spec:** `docs/superpowers/specs/2026-07-12-design-system-foundation-design.md`

**Conventions for every task:**
- Work in repo root `letloyal-production` on branch `master`. Before ANY `git push`, confirm `git remote -v` shows `Jaison650/letloyal-production` (never letloyal-pilot-eu).
- Commit prefix `ds:`.
- After each task: `npm run build` must pass. If it fails, fix before committing.
- Do NOT modify anything under `src/components/ui/` except `Logo.tsx` (Task 3) — legacy components stay as-is.
- Do NOT push to GitHub until the final task; the user confirms deployment.

---

### Task 0: Commit the pending favicon fix (housekeeping)

**Files:**
- Modify: none (commits pre-existing working-tree changes: `src/app/layout.tsx`, `public/favicon.ico`)

- [ ] **Step 1: Inspect the pending change**

Run: `git status --short && git diff src/app/layout.tsx`
Expected: `M src/app/layout.tsx` (adds favicon.ico icon entries) and untracked `public/favicon.ico`. If anything ELSE is modified, stop and ask the user.

- [ ] **Step 2: Commit it separately**

```bash
git add src/app/layout.tsx public/favicon.ico
git commit -m "fix: register favicon.ico in metadata icons"
```

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install Radix primitives + CVA**

Run:
```bash
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-tooltip @radix-ui/react-popover @radix-ui/react-switch @radix-ui/react-checkbox @radix-ui/react-radio-group @radix-ui/react-toast class-variance-authority
```
Expected: installs succeed with no peer-dependency errors (Radix supports React 19).

- [ ] **Step 2: Verify build still passes**

Run: `npm run build`
Expected: build completes (same route count as before).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "ds: add radix primitives and class-variance-authority"
```

---

### Task 2: Fonts via next/font (Manrope + Figtree + Fraunces)

**Files:**
- Create: `src/lib/fonts.ts`
- Modify: `src/app/layout.tsx` (html className), `src/app/globals.css` (remove @import; font-family vars), `tailwind.config.ts` (fontFamily)

- [ ] **Step 1: Create `src/lib/fonts.ts`**

```ts
import { Manrope, Figtree, Fraunces } from 'next/font/google';

export const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500', '600'],
  variable: '--font-serif',
  display: 'swap',
});

export const fontVariables = `${manrope.variable} ${figtree.variable} ${fraunces.variable}`;
```

- [ ] **Step 2: Wire variables into the root layout**

In `src/app/layout.tsx`, add the import and apply to `<html>`:

```tsx
import { fontVariables } from '@/lib/fonts';
```

Find the `<html lang="en">` element in the RootLayout function and change it to:

```tsx
<html lang="en" className={fontVariables} suppressHydrationWarning>
```

(`suppressHydrationWarning` is needed now because Task 12's theme script will set `data-theme` before hydration.)

- [ ] **Step 3: Swap font-families in `src/app/globals.css`**

Delete line 1 (the Google Fonts `@import url('https://fonts.googleapis.com/...')`).

In the `@layer base` block, change:

```css
  body {
    font-family: var(--font-body), 'Inter', sans-serif;
    /* ...rest unchanged... */
  }

  h1, h2, h3, h4 {
    font-family: var(--font-display), 'Plus Jakarta Sans', sans-serif;
  }
```

(Keep the old names as fallbacks in the stack — they'll no longer be loaded, so the fallback chain ends at system sans; this is intentional.)

- [ ] **Step 4: Map Tailwind font utilities in `tailwind.config.ts`**

Replace the existing `fontFamily` block:

```ts
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        // legacy alias so existing `font-jakarta` classes keep working (now renders Manrope)
        jakarta: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
```

- [ ] **Step 5: Verify**

Run: `npm run build`
Expected: PASS. Then `npm run dev`, open `http://localhost:3000`, and confirm in devtools that `<html>` has the three `--font-*` variables and body text renders Figtree (check computed font-family). No layout breakage on the homepage.

- [ ] **Step 6: Commit**

```bash
git add src/lib/fonts.ts src/app/layout.tsx src/app/globals.css tailwind.config.ts
git commit -m "ds: swap to Manrope/Figtree/Fraunces via next/font"
```

---

### Task 3: Logo wordmark font (mark untouched)

**Files:**
- Modify: `src/components/ui/Logo.tsx` (lines ~62 and ~97–98 only — the two `fontFamily` style props)

- [ ] **Step 1: Update the wordmark font in `Logo.tsx`**

In the `Logo` component's `<span style={{...}}>`, change:

```ts
fontFamily: "var(--font-display), 'Plus Jakarta Sans', sans-serif",
```

In the `PoweredBy` component, change the outer `Inter` reference to `var(--font-body), 'Inter', sans-serif` and the inner `Plus Jakarta Sans` reference to `var(--font-display), 'Plus Jakarta Sans', sans-serif`.

Do NOT touch any SVG coordinates, stroke colors, or the `FaviconIcon`/`StandaloneIcon` functions — the mark is fixed.

- [ ] **Step 2: Verify**

Run: `npm run build`
Expected: PASS. In `npm run dev`, homepage header wordmark renders in Manrope.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Logo.tsx
git commit -m "ds: render LetLoyal wordmark in Manrope (mark unchanged)"
```

---

### Task 4: Colour tokens in globals.css (light + dark + toggle override)

**Files:**
- Modify: `src/app/globals.css` (extend the `@layer base` `:root` block; add dark blocks after it)

- [ ] **Step 1: Replace the existing `:root` variables**

The current `:root` has 4 legacy vars (`--primary`, `--primary-dark`, `--accent`, `--brand-bg`). Keep those four lines (legacy pages may reference them) and ADD the token system below them, so `:root` becomes:

```css
  :root {
    /* legacy (kept until all surfaces migrate) */
    --primary: #0D9488;
    --primary-dark: #134E4A;
    --accent: #5EEAD4;
    --brand-bg: #F8FAFC;

    /* ── Teal & Honey tokens — light ─────────────────── */
    --surface-page: #F4F6F2;
    --surface-1: #FFFFFF;
    --surface-2: #ECF0EA;
    --border-default: #E0E6DD;
    --border-strong: #C9D2C5;
    --text-primary: #17201D;
    --text-secondary: #5C6B64;
    --text-tertiary: #93A19A;

    --accent-default: #0B7C6C;
    --accent-hover: #0A5F53;
    --accent-subtle: rgba(11, 124, 108, 0.09);
    --accent-fg: #FFFFFF;

    --reward: #F2B824;
    --reward-deep: #8A6410;
    --reward-subtle: #FBF0CE;
    --reward-fg: #231A04;

    --success: #1E7A4C;
    --success-subtle: rgba(30, 122, 76, 0.10);
    --warning: #96590E;
    --warning-subtle: rgba(150, 89, 14, 0.11);
    --error: #B3382E;
    --error-subtle: rgba(179, 56, 46, 0.09);
    --info: #2E6BD6;
    --info-subtle: rgba(46, 107, 214, 0.10);

    --section-dark: #0E1A17;
    --ring: rgba(11, 124, 108, 0.25);
    --shadow-card: 0 1px 2px rgba(23, 32, 29, 0.05), 0 8px 24px rgba(23, 32, 29, 0.06);
  }
```

- [ ] **Step 2: Add the dark token blocks immediately after `:root`**

```css
  /* Dark theme — OS preference (unless user forced light) */
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
      --surface-page: #0F1513;
      --surface-1: #161E1B;
      --surface-2: #1C2622;
      --border-default: #25322D;
      --border-strong: #37473F;
      --text-primary: #EDF2EE;
      --text-secondary: #9BABA2;
      --text-tertiary: #647169;

      --accent-default: #2CBFA9;
      --accent-hover: #5EEAD4;
      --accent-subtle: rgba(44, 191, 169, 0.13);
      --accent-fg: #06231D;

      --reward: #F2C230;
      --reward-deep: #F5D269;
      --reward-subtle: rgba(242, 194, 48, 0.14);
      --reward-fg: #231A04;

      --success: #4ADE94;
      --success-subtle: rgba(74, 222, 148, 0.12);
      --warning: #F0B25A;
      --warning-subtle: rgba(240, 178, 90, 0.12);
      --error: #F0716C;
      --error-subtle: rgba(240, 113, 108, 0.12);
      --info: #7AA7F0;
      --info-subtle: rgba(122, 167, 240, 0.14);

      --section-dark: #0A100E;
      --ring: rgba(44, 191, 169, 0.35);
      --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.5), 0 10px 30px rgba(0, 0, 0, 0.4);
    }
  }

  /* Dark theme — explicit user toggle (always wins) */
  :root[data-theme='dark'] {
    --surface-page: #0F1513;
    --surface-1: #161E1B;
    --surface-2: #1C2622;
    --border-default: #25322D;
    --border-strong: #37473F;
    --text-primary: #EDF2EE;
    --text-secondary: #9BABA2;
    --text-tertiary: #647169;

    --accent-default: #2CBFA9;
    --accent-hover: #5EEAD4;
    --accent-subtle: rgba(44, 191, 169, 0.13);
    --accent-fg: #06231D;

    --reward: #F2C230;
    --reward-deep: #F5D269;
    --reward-subtle: rgba(242, 194, 48, 0.14);
    --reward-fg: #231A04;

    --success: #4ADE94;
    --success-subtle: rgba(74, 222, 148, 0.12);
    --warning: #F0B25A;
    --warning-subtle: rgba(240, 178, 90, 0.12);
    --error: #F0716C;
    --error-subtle: rgba(240, 113, 108, 0.12);
    --info: #7AA7F0;
    --info-subtle: rgba(122, 167, 240, 0.14);

    --section-dark: #0A100E;
    --ring: rgba(44, 191, 169, 0.35);
    --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.5), 0 10px 30px rgba(0, 0, 0, 0.4);
  }
```

IMPORTANT: existing pages hardcode `bg-white`/`#F8FAFC` etc., so they render identically in both themes — the tokens only affect components that consume them.

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: PASS. Homepage unchanged visually.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "ds: add Teal & Honey colour tokens (light/dark/toggle)"
```

---

### Task 5: Tailwind token mapping + type scale + shape tokens

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add token-mapped colours to `theme.extend.colors`**

Keep every existing key (`primary`, `accent`, `brand`, `text`, `status` — legacy pages use them). ADD these siblings:

```ts
        surface: {
          page: 'var(--surface-page)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
        },
        ink: {
          DEFAULT: 'var(--text-primary)',
          sub: 'var(--text-secondary)',
          faint: 'var(--text-tertiary)',
        },
        stroke: {
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        teal: {
          DEFAULT: 'var(--accent-default)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
          fg: 'var(--accent-fg)',
        },
        reward: {
          DEFAULT: 'var(--reward)',
          deep: 'var(--reward-deep)',
          subtle: 'var(--reward-subtle)',
          fg: 'var(--reward-fg)',
        },
        good: { DEFAULT: 'var(--success)', subtle: 'var(--success-subtle)' },
        warn: { DEFAULT: 'var(--warning)', subtle: 'var(--warning-subtle)' },
        bad: { DEFAULT: 'var(--error)', subtle: 'var(--error-subtle)' },
        note: { DEFAULT: 'var(--info)', subtle: 'var(--info-subtle)' },
        'section-dark': 'var(--section-dark)',
```

(NOTE: Tailwind's built-in `teal` palette is shadowed by this — acceptable; grep first with `grep -rn "teal-[0-9]" src --include='*.tsx'` and if any page uses numeric teal classes, keep them working by adding the used numeric steps back, e.g. `teal: { DEFAULT: ..., 500: '#14b8a6' }`.)

- [ ] **Step 2: Add the named type scale to `theme.extend.fontSize`**

```ts
      fontSize: {
        display: ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
        h1: ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '800' }],
        h2: ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        h3: ['1.375rem', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '700' }],
        h4: ['1.0625rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
        'body-lg': ['1.03125rem', { lineHeight: '1.6' }],
        body: ['0.90625rem', { lineHeight: '1.55' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.4' }],
        label: ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.08em', fontWeight: '700' }],
      },
```

- [ ] **Step 3: Add shadow + ring tokens to `theme.extend`**

```ts
      boxShadow: {
        // ...existing card/btn entries stay...
        ds: 'var(--shadow-card)',
        ring: '0 0 0 3px var(--ring)',
      },
```

(Merge into the existing `boxShadow` object — do not delete the legacy `card`/`btn` entries.)

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts
git commit -m "ds: map tailwind utilities to tokens, add type scale"
```

---

### Task 6: `cn()` helper

**Files:**
- Create: `src/lib/cn.ts`

- [ ] **Step 1: Create `src/lib/cn.ts`**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Verify + commit**

Run: `npm run build` → PASS.

```bash
git add src/lib/cn.ts
git commit -m "ds: add cn() class helper"
```

---

### Task 7: Button (ds)

**Files:**
- Create: `src/components/ds/Button.tsx`

- [ ] **Step 1: Create `src/components/ds/Button.tsx`**

```tsx
'use client';
import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  // pill shape per design language; visible focus ring; 44px min touch target on md+
  'inline-flex items-center justify-center gap-2 rounded-full font-sans font-bold transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-ring',
  {
    variants: {
      intent: {
        primary: 'bg-teal text-teal-fg hover:bg-teal-hover',
        reward: 'bg-reward text-reward-fg hover:brightness-95',
        secondary: 'bg-surface-1 text-ink border border-stroke-strong hover:bg-surface-2',
        ghost: 'text-teal hover:bg-teal-subtle',
        destructive: 'bg-bad-subtle text-bad hover:bg-bad hover:text-white',
      },
      size: {
        sm: 'h-9 px-4 text-body-sm',
        md: 'h-11 px-6 text-body',
        lg: 'h-12 px-8 text-body-lg',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { intent: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, size, fullWidth, asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ intent, size, fullWidth }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';
```

- [ ] **Step 2: Verify + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/ds/Button.tsx
git commit -m "ds: Button component (primary/reward/secondary/ghost/destructive)"
```

---

### Task 8: Input + Textarea (ds)

**Files:**
- Create: `src/components/ds/Input.tsx`, `src/components/ds/Textarea.tsx`

- [ ] **Step 1: Create `src/components/ds/Input.tsx`**

```tsx
'use client';
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

export const fieldVariants = cva(
  'w-full rounded-[11px] border-[1.5px] bg-surface-1 font-sans text-ink placeholder:text-ink-faint transition-colors focus:outline-none focus:border-teal focus:shadow-ring disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'px-3 py-2 text-body-sm',
        md: 'px-3.5 py-2.5 text-[16px] md:text-body', // 16px on mobile prevents iOS zoom
      },
      invalid: {
        true: 'border-bad focus:border-bad',
        false: 'border-stroke-strong',
      },
    },
    defaultVariants: { size: 'md', invalid: false },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof fieldVariants> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldVariants({ size, invalid }), className)}
      {...props}
    />
  )
);
Input.displayName = 'Input';
```

- [ ] **Step 2: Create `src/components/ds/Textarea.tsx`**

```tsx
'use client';
import { forwardRef } from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { fieldVariants } from './Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    Pick<VariantProps<typeof fieldVariants>, 'invalid'> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldVariants({ size: 'md', invalid }), 'min-h-[96px]', className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
```

- [ ] **Step 3: Verify + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/ds/Input.tsx src/components/ds/Textarea.tsx
git commit -m "ds: Input and Textarea components"
```

---

### Task 9: Badge, Card, Skeleton, EmptyState (ds)

**Files:**
- Create: `src/components/ds/Badge.tsx`, `src/components/ds/Card.tsx`, `src/components/ds/Skeleton.tsx`, `src/components/ds/EmptyState.tsx`

- [ ] **Step 1: Create `src/components/ds/Badge.tsx`**

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-bold',
  {
    variants: {
      intent: {
        neutral: 'bg-surface-2 text-ink-sub',
        success: 'bg-good-subtle text-good',
        warning: 'bg-warn-subtle text-warn',
        error: 'bg-bad-subtle text-bad',
        teal: 'bg-teal-subtle text-teal',
        reward: 'bg-reward-subtle text-reward-deep',
      },
      dot: { true: '', false: '' },
    },
    defaultVariants: { intent: 'neutral', dot: true },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, intent, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ intent, dot }), className)} {...props}>
      {dot && <i aria-hidden className="h-1 w-1 rounded-full bg-current" />}
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Create `src/components/ds/Card.tsx`**

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const cardVariants = cva('rounded-2xl border border-stroke bg-surface-1 shadow-ds', {
  variants: {
    padding: { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' },
    interactive: {
      true: 'transition-shadow hover:shadow-lg cursor-pointer',
    },
  },
  defaultVariants: { padding: 'md' },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, padding, interactive, ...props }: CardProps) {
  return <div className={cn(cardVariants({ padding, interactive }), className)} {...props} />;
}
```

NOTE: the repo's Tailwind config overrides `rounded-2xl` to 14px; the design language wants 16px cards. Add `'2.5xl': '16px'` under `borderRadius` in `tailwind.config.ts` and use `rounded-[16px]` here instead if the visual check shows 14px. Simplest: use `rounded-[16px]` directly in `cardVariants` — do that.

- [ ] **Step 3: Create `src/components/ds/Skeleton.tsx`**

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const skeletonVariants = cva('animate-pulse bg-surface-2', {
  variants: {
    shape: {
      text: 'h-4 rounded-md',
      rect: 'rounded-[11px]',
      circle: 'rounded-full',
    },
  },
  defaultVariants: { shape: 'text' },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, shape, ...props }: SkeletonProps) {
  return <div aria-hidden className={cn(skeletonVariants({ shape }), className)} {...props} />;
}
```

- [ ] **Step 4: Create `src/components/ds/EmptyState.tsx`**

```tsx
import { cn } from '@/lib/cn';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-stroke-strong bg-surface-2/50 px-6 py-12 text-center',
        className
      )}
      {...props}
    >
      {icon && <div className="mb-1 text-ink-faint">{icon}</div>}
      <p className="font-display text-h4 text-ink">{title}</p>
      {description && <p className="max-w-sm text-body-sm text-ink-sub">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 5: Verify + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/ds/Badge.tsx src/components/ds/Card.tsx src/components/ds/Skeleton.tsx src/components/ds/EmptyState.tsx
git commit -m "ds: Badge, Card, Skeleton, EmptyState components"
```

---

### Task 10: Checkbox, RadioGroup, Switch, Select (ds)

**Files:**
- Create: `src/components/ds/Checkbox.tsx`, `src/components/ds/RadioGroup.tsx`, `src/components/ds/Switch.tsx`, `src/components/ds/Select.tsx`

- [ ] **Step 1: Create `src/components/ds/Checkbox.tsx`**

```tsx
'use client';
import { forwardRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '@/lib/cn';

export const Checkbox = forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'h-5 w-5 shrink-0 rounded-md border-[1.5px] border-stroke-strong bg-surface-1 transition-colors',
      'focus-visible:outline-none focus-visible:shadow-ring',
      'data-[state=checked]:border-teal data-[state=checked]:bg-teal data-[state=checked]:text-teal-fg',
      'disabled:opacity-50',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
        <path d="M5 12.5l4.2 4L19 7" />
      </svg>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = 'Checkbox';
```

- [ ] **Step 2: Create `src/components/ds/RadioGroup.tsx`**

```tsx
'use client';
import { forwardRef } from 'react';
import * as RadioPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/cn';

export const RadioGroup = forwardRef<
  React.ElementRef<typeof RadioPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioPrimitive.Root ref={ref} className={cn('grid gap-2.5', className)} {...props} />
));
RadioGroup.displayName = 'RadioGroup';

export const RadioGroupItem = forwardRef<
  React.ElementRef<typeof RadioPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioPrimitive.Item
    ref={ref}
    className={cn(
      'h-5 w-5 rounded-full border-[1.5px] border-stroke-strong bg-surface-1 transition-colors',
      'focus-visible:outline-none focus-visible:shadow-ring',
      'data-[state=checked]:border-teal',
      'disabled:opacity-50',
      className
    )}
    {...props}
  >
    <RadioPrimitive.Indicator className="flex items-center justify-center">
      <span className="h-2.5 w-2.5 rounded-full bg-teal" />
    </RadioPrimitive.Indicator>
  </RadioPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';
```

- [ ] **Step 3: Create `src/components/ds/Switch.tsx`**

```tsx
'use client';
import { forwardRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/cn';

export const Switch = forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent bg-stroke-strong transition-colors',
      'focus-visible:outline-none focus-visible:shadow-ring',
      'data-[state=checked]:bg-teal disabled:opacity-50',
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
  </SwitchPrimitive.Root>
));
Switch.displayName = 'Switch';
```

- [ ] **Step 4: Create `src/components/ds/Select.tsx`**

```tsx
'use client';
import { forwardRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/cn';

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex w-full items-center justify-between gap-2 rounded-[11px] border-[1.5px] border-stroke-strong bg-surface-1 px-3.5 py-2.5 text-body text-ink',
      'placeholder:text-ink-faint focus:outline-none focus:border-teal focus:shadow-ring disabled:opacity-50',
      'data-[placeholder]:text-ink-faint',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-ink-faint">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={6}
      className={cn(
        'z-50 min-w-[--radix-select-trigger-width] overflow-hidden rounded-xl border border-stroke bg-surface-1 p-1 shadow-ds',
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

export const SelectItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-body text-ink outline-none',
      'data-[highlighted]:bg-teal-subtle data-[state=checked]:font-bold',
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';
```

- [ ] **Step 5: Verify + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/ds/Checkbox.tsx src/components/ds/RadioGroup.tsx src/components/ds/Switch.tsx src/components/ds/Select.tsx
git commit -m "ds: Checkbox, RadioGroup, Switch, Select components"
```

---

### Task 11: Tabs, Tooltip, Popover, Dialog, Drawer (ds)

**Files:**
- Create: `src/components/ds/Tabs.tsx`, `src/components/ds/Tooltip.tsx`, `src/components/ds/Popover.tsx`, `src/components/ds/Dialog.tsx`, `src/components/ds/Drawer.tsx`

- [ ] **Step 1: Create `src/components/ds/Tabs.tsx`**

```tsx
'use client';
import { forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/cn';

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { variant?: 'pill' | 'underline' }
>(({ className, variant = 'pill', ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      variant === 'pill'
        ? 'inline-flex items-center gap-1 rounded-full bg-surface-2 p-1'
        : 'inline-flex items-center gap-5 border-b border-stroke',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { variant?: 'pill' | 'underline' }
>(({ className, variant = 'pill', ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'text-body-sm font-bold text-ink-sub transition-colors focus-visible:outline-none focus-visible:shadow-ring',
      variant === 'pill'
        ? 'rounded-full px-4 py-1.5 data-[state=active]:bg-surface-1 data-[state=active]:text-ink data-[state=active]:shadow-sm'
        : '-mb-px border-b-2 border-transparent pb-2 data-[state=active]:border-teal data-[state=active]:text-ink',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = TabsPrimitive.Content;
```

- [ ] **Step 2: Create `src/components/ds/Tooltip.tsx`**

```tsx
'use client';
import { forwardRef } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/cn';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 max-w-xs rounded-lg bg-ink px-3 py-1.5 text-caption font-medium text-surface-1',
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = 'TooltipContent';
```

- [ ] **Step 3: Create `src/components/ds/Popover.tsx`**

```tsx
'use client';
import { forwardRef } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/cn';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export const PopoverContent = forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, sideOffset = 8, align = 'center', ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      className={cn(
        'z-50 w-72 rounded-xl border border-stroke bg-surface-1 p-4 shadow-ds focus-visible:outline-none',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = 'PopoverContent';
```

- [ ] **Step 4: Create `src/components/ds/Dialog.tsx`**

```tsx
'use client';
import { forwardRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const contentVariants = cva(
  'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-[16px] border border-stroke bg-surface-1 p-6 shadow-ds focus-visible:outline-none',
  {
    variants: {
      size: { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' },
    },
    defaultVariants: { size: 'md' },
  }
);

export const DialogContent = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & VariantProps<typeof contentVariants>
>(({ className, size, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
    <DialogPrimitive.Content ref={ref} className={cn(contentVariants({ size }), className)} {...props}>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = 'DialogContent';

export function DialogHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <DialogPrimitive.Title className="font-display text-h3 text-ink">{title}</DialogPrimitive.Title>
      {description && (
        <DialogPrimitive.Description className="mt-1 text-body-sm text-ink-sub">
          {description}
        </DialogPrimitive.Description>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `src/components/ds/Drawer.tsx`** (Radix Dialog positioned as a side sheet)

```tsx
'use client';
import { forwardRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/cn';

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerTitle = DialogPrimitive.Title;

export const DrawerContent = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: 'right' | 'bottom' }
>(({ className, side = 'right', children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 border-stroke bg-surface-1 p-6 shadow-ds focus-visible:outline-none',
        side === 'right'
          ? 'inset-y-0 right-0 w-full max-w-sm border-l'
          : 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-[16px] border-t',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DrawerContent.displayName = 'DrawerContent';
```

- [ ] **Step 6: Verify + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/ds/Tabs.tsx src/components/ds/Tooltip.tsx src/components/ds/Popover.tsx src/components/ds/Dialog.tsx src/components/ds/Drawer.tsx
git commit -m "ds: Tabs, Tooltip, Popover, Dialog, Drawer components"
```

---

### Task 12: Toast (ds)

**Files:**
- Create: `src/components/ds/Toast.tsx`

- [ ] **Step 1: Create `src/components/ds/Toast.tsx`** — Radix Toast with an imperative `useToast` hook:

```tsx
'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';

type Intent = 'success' | 'error' | 'info' | 'reward';
type ToastItem = { id: number; title: string; description?: string; intent: Intent };

const ToastCtx = createContext<{ toast: (t: Omit<ToastItem, 'id'>) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const rootVariants = cva(
  'flex items-start gap-3 rounded-xl border bg-surface-1 p-4 shadow-ds data-[state=closed]:animate-out data-[state=closed]:fade-out',
  {
    variants: {
      intent: {
        success: 'border-l-[3px] border-l-good border-stroke',
        error: 'border-l-[3px] border-l-bad border-stroke',
        info: 'border-l-[3px] border-l-note border-stroke',
        reward: 'border-l-[3px] border-l-reward border-stroke',
      },
    },
  }
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((t: Omit<ToastItem, 'id'>) => {
    setItems((prev) => [...prev, { ...t, id: Date.now() + Math.random() }]);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4500}>
        {children}
        {items.map((item) => (
          <ToastPrimitive.Root
            key={item.id}
            className={cn(rootVariants({ intent: item.intent }))}
            onOpenChange={(open) => {
              if (!open) setItems((prev) => prev.filter((i) => i.id !== item.id));
            }}
          >
            <div className="flex-1">
              <ToastPrimitive.Title className="text-body-sm font-bold text-ink">
                {item.title}
              </ToastPrimitive.Title>
              {item.description && (
                <ToastPrimitive.Description className="mt-0.5 text-caption text-ink-sub">
                  {item.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close aria-label="Dismiss" className="text-ink-faint hover:text-ink">
              ✕
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" />
      </ToastPrimitive.Provider>
    </ToastCtx.Provider>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/ds/Toast.tsx
git commit -m "ds: Toast provider with useToast hook"
```

---

### Task 13: Table (ds)

**Files:**
- Create: `src/components/ds/Table.tsx`

- [ ] **Step 1: Create `src/components/ds/Table.tsx`**

```tsx
import { cn } from '@/lib/cn';

type Density = 'comfortable' | 'compact';
const cellPad: Record<Density, string> = {
  comfortable: 'px-3.5 py-3',
  compact: 'px-3 py-2',
};

export function Table({
  density = 'comfortable',
  className,
  children,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & { density?: Density }) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        data-density={density}
        className={cn('w-full border-collapse text-body-sm [font-variant-numeric:tabular-nums]', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-surface-2', className)} {...props} />;
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-3.5 py-2 text-left text-label uppercase text-ink-faint first:rounded-l-lg last:rounded-r-lg',
        className
      )}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b border-stroke last:border-b-0', className)} {...props} />;
}

export function TD({
  density = 'comfortable',
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { density?: Density }) {
  return <td className={cn(cellPad[density], 'text-ink-sub', className)} {...props} />;
}
```

- [ ] **Step 2: Verify + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/ds/Table.tsx
git commit -m "ds: Table components with density variants"
```

---

### Task 14: Barrel export

**Files:**
- Create: `src/components/ds/index.ts`

- [ ] **Step 1: Create `src/components/ds/index.ts`**

```ts
export { Button, type ButtonProps } from './Button';
export { Input, type InputProps, fieldVariants } from './Input';
export { Textarea, type TextareaProps } from './Textarea';
export { Badge, type BadgeProps } from './Badge';
export { Card, type CardProps } from './Card';
export { Skeleton, type SkeletonProps } from './Skeleton';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { Checkbox } from './Checkbox';
export { RadioGroup, RadioGroupItem } from './RadioGroup';
export { Switch } from './Switch';
export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from './Select';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './Tooltip';
export { Popover, PopoverTrigger, PopoverContent } from './Popover';
export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader } from './Dialog';
export { Drawer, DrawerTrigger, DrawerClose, DrawerTitle, DrawerContent } from './Drawer';
export { ToastProvider, useToast } from './Toast';
export { Table, THead, TH, TBody, TR, TD } from './Table';
```

- [ ] **Step 2: Verify + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/ds/index.ts
git commit -m "ds: barrel export for design-system components"
```

---

### Task 15: Theme switching (provider + toggle + no-flash script)

**Files:**
- Create: `src/components/ds/ThemeProvider.tsx`, `src/components/ds/ThemeToggle.tsx`
- Modify: `src/app/layout.tsx` (inline script in `<head>`), `src/components/ds/index.ts`

- [ ] **Step 1: Create `src/components/ds/ThemeProvider.tsx`**

```tsx
'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'system',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') setThemeState(stored);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (t === 'system') {
      localStorage.removeItem('theme');
      document.documentElement.removeAttribute('data-theme');
    } else {
      localStorage.setItem('theme', t);
      document.documentElement.setAttribute('data-theme', t);
    }
  }, []);

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}
```

- [ ] **Step 2: Create `src/components/ds/ThemeToggle.tsx`**

```tsx
'use client';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-stroke-strong bg-surface-1 text-ink-sub transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:shadow-ring',
        className
      )}
    >
      {isDark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" /></svg>
      )}
    </button>
  );
}
```

- [ ] **Step 3: Add the no-flash script to `src/app/layout.tsx`**

Inside the returned JSX, add a `<head>` child before `<body>` (Next allows explicit head tags in the root layout for scripts):

```tsx
<head>
  <script
    dangerouslySetInnerHTML={{
      __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}`,
    }}
  />
</head>
```

(The `suppressHydrationWarning` on `<html>` from Task 2 covers the attribute mismatch.)

Do NOT wrap the app in `<ThemeProvider>` yet and do NOT place the toggle anywhere — surfaces opt in during their own migration phases. The script is safe now: no page consumes the tokens, so `data-theme` changes nothing visible.

- [ ] **Step 4: Export from barrel** — append to `src/components/ds/index.ts`:

```ts
export { ThemeProvider, useTheme } from './ThemeProvider';
export { ThemeToggle } from './ThemeToggle';
```

- [ ] **Step 5: Verify + commit**

Run: `npm run build` → PASS. In dev, run `localStorage.setItem('theme','dark')` in the console, reload, and confirm `<html data-theme="dark">` appears with no flash and no visual change to the homepage.

```bash
git add src/components/ds/ThemeProvider.tsx src/components/ds/ThemeToggle.tsx src/components/ds/index.ts src/app/layout.tsx
git commit -m "ds: theme provider, toggle, and no-flash bootstrap script"
```

---

### Task 16: `/design-system` preview route (dev-gated)

**Files:**
- Create: `src/app/design-system/page.tsx`, `src/app/design-system/Showcase.tsx`

- [ ] **Step 1: Create `src/app/design-system/page.tsx`** (server component; 404s in production)

```tsx
import { notFound } from 'next/navigation';
import Showcase from './Showcase';

export const metadata = { title: 'Design System', robots: { index: false, follow: false } };

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <Showcase />;
}
```

(Client-bundle gotcha from project memory: `Showcase` is a pure client component with no server-only imports, so the NODE_ENV gate stays server-side. Never import `db.ts`/`mail.ts` here.)

- [ ] **Step 2: Create `src/app/design-system/Showcase.tsx`** (client component that renders every component in every variant, with a theme toggle):

```tsx
'use client';
import {
  Button, Input, Textarea, Badge, Card, Skeleton, EmptyState,
  Checkbox, RadioGroup, RadioGroupItem, Switch,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Tabs, TabsList, TabsTrigger, TabsContent,
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
  Popover, PopoverTrigger, PopoverContent,
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogClose,
  Table, THead, TH, TBody, TR, TD,
  ToastProvider, useToast, ThemeProvider, ThemeToggle,
} from '@/components/ds';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-label uppercase text-ink-faint">{title}</h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

function ToastDemo() {
  const { toast } = useToast();
  return (
    <>
      <Button intent="secondary" size="sm" onClick={() => toast({ title: 'Saved', description: 'Campaign updated.', intent: 'success' })}>Success toast</Button>
      <Button intent="secondary" size="sm" onClick={() => toast({ title: 'Reward unlocked', description: 'Free coffee added to wallet.', intent: 'reward' })}>Reward toast</Button>
      <Button intent="secondary" size="sm" onClick={() => toast({ title: 'Something went wrong', description: 'Could not reach the server.', intent: 'error' })}>Error toast</Button>
    </>
  );
}

export default function Showcase() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TooltipProvider>
          <main className="min-h-screen bg-surface-page px-6 py-10 text-ink">
            <div className="mx-auto flex max-w-4xl flex-col gap-10">
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-h2 text-ink">Design system</h1>
                  <p className="text-body-sm text-ink-sub">Teal &amp; Honey — every component, both themes.</p>
                </div>
                <ThemeToggle />
              </header>

              <Section title="Buttons">
                <Button>Create campaign</Button>
                <Button intent="reward">Redeem reward</Button>
                <Button intent="secondary">Export</Button>
                <Button intent="ghost">View all</Button>
                <Button intent="destructive">Delete</Button>
                <Button loading>Saving…</Button>
                <Button size="sm">Small</Button>
                <Button size="lg">Large</Button>
              </Section>

              <Section title="Badges">
                <Badge intent="neutral">Draft</Badge>
                <Badge intent="success">Active</Badge>
                <Badge intent="warning">Paused</Badge>
                <Badge intent="error">Expired</Badge>
                <Badge intent="teal">New</Badge>
                <Badge intent="reward">Reward due</Badge>
              </Section>

              <Section title="Form fields">
                <div className="grid w-full max-w-md gap-3">
                  <Input placeholder="Search customers…" />
                  <Input invalid defaultValue="98765" aria-label="Phone" />
                  <Textarea placeholder="Campaign description…" />
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Choose a campaign" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monsoon">Monsoon double points</SelectItem>
                      <SelectItem value="weekend">Weekend streak</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-body-sm"><Checkbox defaultChecked /> SMS opt-in</label>
                    <label className="flex items-center gap-2 text-body-sm"><Switch defaultChecked /> Auto-renew</label>
                  </div>
                  <RadioGroup defaultValue="points" className="flex gap-6">
                    <label className="flex items-center gap-2 text-body-sm"><RadioGroupItem value="points" /> Points</label>
                    <label className="flex items-center gap-2 text-body-sm"><RadioGroupItem value="stamps" /> Stamps</label>
                  </RadioGroup>
                </div>
              </Section>

              <Section title="Tabs">
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="pt-3 text-body-sm text-ink-sub">Overview content</TabsContent>
                  <TabsContent value="campaigns" className="pt-3 text-body-sm text-ink-sub">Campaigns content</TabsContent>
                  <TabsContent value="customers" className="pt-3 text-body-sm text-ink-sub">Customers content</TabsContent>
                </Tabs>
              </Section>

              <Section title="Overlays">
                <Dialog>
                  <DialogTrigger asChild><Button intent="secondary" size="sm">Open dialog</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader title="Delete campaign?" description="This can't be undone. Customers keep already-earned points." />
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild><Button intent="secondary" size="sm">Cancel</Button></DialogClose>
                      <Button intent="destructive" size="sm">Delete</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Tooltip>
                  <TooltipTrigger asChild><Button intent="ghost" size="sm">Hover me</Button></TooltipTrigger>
                  <TooltipContent>Points expire after 12 months.</TooltipContent>
                </Tooltip>
                <Popover>
                  <PopoverTrigger asChild><Button intent="secondary" size="sm">Open popover</Button></PopoverTrigger>
                  <PopoverContent className="text-body-sm text-ink-sub">Filter customers by tier, points, or last-visit date.</PopoverContent>
                </Popover>
                <ToastDemo />
              </Section>

              <Section title="Table">
                <Card padding="sm" className="w-full">
                  <Table>
                    <THead><TR><TH>Customer</TH><TH>Points</TH><TH>Status</TH></TR></THead>
                    <TBody>
                      <TR><TD className="font-bold text-ink">Arjun Reddy</TD><TD>720 / 1000</TD><TD><Badge intent="success">Active</Badge></TD></TR>
                      <TR><TD className="font-bold text-ink">Sana Mehta</TD><TD>980 / 1000</TD><TD><Badge intent="reward">Reward due</Badge></TD></TR>
                    </TBody>
                  </Table>
                </Card>
              </Section>

              <Section title="Loading & empty">
                <div className="flex w-full max-w-md flex-col gap-3">
                  <Skeleton className="w-2/3" />
                  <Skeleton className="w-1/2" />
                  <Skeleton shape="rect" className="h-20 w-full" />
                  <EmptyState
                    title="No campaigns yet"
                    description="Create your first campaign to start rewarding repeat visits."
                    action={<Button size="sm">Create campaign</Button>}
                  />
                </div>
              </Section>
            </div>
          </main>
        </TooltipProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`, open `http://localhost:3000/design-system`.
Check: every section renders; toggle switches themes instantly (whole page recolours); dialog traps focus and closes on Esc; select/tabs/radio work with arrow keys; toasts appear and dismiss.

- [ ] **Step 4: Verify production gating**

Run: `npm run build` → PASS (route listed as dynamic or static is fine — `notFound()` fires at request time in production).

- [ ] **Step 5: Commit**

```bash
git add src/app/design-system/page.tsx src/app/design-system/Showcase.tsx
git commit -m "ds: dev-only /design-system showcase route"
```

---

### Task 17: Contrast check script

**Files:**
- Create: `scripts/check-contrast.mjs`
- Modify: `package.json` (add script)

- [ ] **Step 1: Create `scripts/check-contrast.mjs`**

```js
// WCAG 2.1 contrast checker for Teal & Honey token pairs.
// Solid-on-solid pairs only (rgba subtle backgrounds are checked visually on /design-system).

const light = {
  page: '#F4F6F2', s1: '#FFFFFF', s2: '#ECF0EA',
  textP: '#17201D', textS: '#5C6B64', textT: '#93A19A',
  accent: '#0B7C6C', accentFg: '#FFFFFF',
  reward: '#F2B824', rewardDeep: '#8A6410', rewardSubtle: '#FBF0CE', rewardFg: '#231A04',
  good: '#1E7A4C', warn: '#96590E', bad: '#B3382E', info: '#2E6BD6',
};
const dark = {
  page: '#0F1513', s1: '#161E1B', s2: '#1C2622',
  textP: '#EDF2EE', textS: '#9BABA2', textT: '#647169',
  accent: '#2CBFA9', accentFg: '#06231D',
  reward: '#F2C230', rewardDeep: '#F5D269', rewardFg: '#231A04',
  good: '#4ADE94', warn: '#F0B25A', bad: '#F0716C', info: '#7AA7F0',
};

function lum(hex) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    let v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [name, fg, bg, minimum]  — 4.5 body text, 3.0 large text / UI components
const checks = [
  ['light text-primary on page', light.textP, light.page, 4.5],
  ['light text-primary on surface-1', light.textP, light.s1, 4.5],
  ['light text-secondary on surface-1', light.textS, light.s1, 4.5],
  ['light text-tertiary on surface-1 (large/labels)', light.textT, light.s1, 3.0],
  ['light accent-fg on accent (buttons)', light.accentFg, light.accent, 4.5],
  ['light accent on surface-1 (links)', light.accent, light.s1, 4.5],
  ['light reward-fg on reward (buttons)', light.rewardFg, light.reward, 4.5],
  ['light reward-deep on reward-subtle (badges)', light.rewardDeep, light.rewardSubtle, 4.5],
  ['light good on surface-1', light.good, light.s1, 4.5],
  ['light warn on surface-1', light.warn, light.s1, 4.5],
  ['light bad on surface-1', light.bad, light.s1, 4.5],
  ['light info on surface-1', light.info, light.s1, 4.5],

  ['dark text-primary on page', dark.textP, dark.page, 4.5],
  ['dark text-primary on surface-1', dark.textP, dark.s1, 4.5],
  ['dark text-secondary on surface-1', dark.textS, dark.s1, 4.5],
  ['dark text-tertiary on surface-1 (large/labels)', dark.textT, dark.s1, 3.0],
  ['dark accent-fg on accent (buttons)', dark.accentFg, dark.accent, 4.5],
  ['dark accent on surface-1 (links)', dark.accent, dark.s1, 4.5],
  ['dark reward-fg on reward (buttons)', dark.rewardFg, dark.reward, 4.5],
  ['dark good on surface-1', dark.good, dark.s1, 4.5],
  ['dark warn on surface-1', dark.warn, dark.s1, 4.5],
  ['dark bad on surface-1', dark.bad, dark.s1, 4.5],
  ['dark info on surface-1', dark.info, dark.s1, 4.5],
];

let failed = 0;
for (const [name, fg, bg, min] of checks) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1 (min ${min})  ${name}`);
}
if (failed) {
  console.error(`\n${failed} contrast check(s) failed.`);
  process.exit(1);
}
console.log('\nAll contrast checks passed.');
```

- [ ] **Step 2: Add npm script** — in `package.json` `"scripts"`:

```json
    "check:contrast": "node scripts/check-contrast.mjs",
```

- [ ] **Step 3: Run it**

Run: `npm run check:contrast`
Expected: all PASS. **If any pair fails, darken/lighten that token minimally to pass, update BOTH `globals.css` and this script, and note the change in the commit message.** (Likely borderline: `light.textT #93A19A` and `dark.textT #647169` at 3:1 — if they fail, shift to `#8A968F` / `#6B7A73` respectively and re-run.)

- [ ] **Step 4: Commit**

```bash
git add scripts/check-contrast.mjs package.json
git commit -m "ds: WCAG contrast checker for token pairs"
```

---

### Task 18: Final verification + deploy gate

**Files:** none (verification only)

- [ ] **Step 1: Full build + lint**

Run: `npm run build && npm run lint`
Expected: build PASS, lint clean (or only pre-existing warnings — compare with `git stash`-free baseline if unsure).

- [ ] **Step 2: Visual regression sweep of existing pages**

Run `npm run dev` and open each of: `/` (homepage), `/merchant/login`, `/my-rewards`, one merchant page under `/p/[slug]` (use a seeded slug). Confirm: layout identical to before; ONLY the typefaces changed (Manrope headings / Figtree body). Look specifically for text overflow in buttons/nav where font metrics differ.

- [ ] **Step 3: Showcase sweep**

Open `/design-system`: run through both themes again after all tasks; confirm no console errors.

- [ ] **Step 4: Repo + push gate (STOP — requires user confirmation)**

Run: `git remote -v` → must show `Jaison650/letloyal-production`.
Then ASK THE USER before pushing: "Foundation complete (N commits). Push to GitHub and deploy via `./deploy.sh` on the VPS?" Do not push without an explicit yes. Deployment = `git push origin master`, then user (or you, if instructed) runs `./deploy.sh` on the VPS (72.60.18.98) and confirms PM2 shows the app online.

---

## Self-review notes

- **Spec coverage:** tokens (Tasks 4–5), typography + next/font + wordmark (2–3), component library incl. every table row from the spec (7–14 — Dropdown Menu is installed in Task 1 but only Select/Popover consume menus today; a dedicated DropdownMenu component is YAGNI until a surface needs it), theme switching (15), `/design-system` route (16), contrast checks (17), build/visual verification (18), deploy flow (18). Legacy `globals.css` classes intentionally untouched (spec: deprecated in place).
- **Known simplifications:** Toast uses state-array rendering rather than Radix's imperative queue — adequate for the product's toast volume. Drawer reuses Radix Dialog rather than a dedicated primitive. EmptyState/Skeleton have no Radix dependency by design.
- **Type consistency:** `cn` from `@/lib/cn` everywhere; token utility names (`surface-page`, `ink-sub`, `stroke-strong`, `teal-fg`, `reward-subtle`, `good/warn/bad/note`) match Task 5's Tailwind mapping; `fieldVariants` exported from Input and reused by Textarea.
