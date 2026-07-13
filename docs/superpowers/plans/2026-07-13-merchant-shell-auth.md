# Merchant Shell + Auth Redesign ("Teal & Honey" Phase 2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the merchant portal frame into Teal & Honey — DashboardShell, dashboard home page, and the five auth pages — with zero behaviour change.

**Architecture:** Restyle-in-place for DashboardShell and the dashboard page (class swaps + ds components; queries/handlers untouched). New shared `AuthShell` (dark brand panel + form column) wraps the five auth pages, which keep their exact form state, fetch calls, and redirects. Theme toggle is NOT mounted (Phase 2b).

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind tokens (Phase 0), `@/components/ds`, lucide-react.

**Spec:** `docs/superpowers/specs/2026-07-13-merchant-shell-auth-design.md`

**Conventions for every task:**
- Repo root `letloyal-production`, branch `master`. Verify `git remote -v` shows `Jaison650/letloyal-production` before any push; never push before the final task's user gate.
- Commit prefix `mrp:` (merchant portal). `npm run build` AND `npx tsc --noEmit` must pass before each commit.
- **Behaviour-preservation is the prime rule:** no changes to any `fetch` call, handler, state variable, redirect, query, field name, `autoComplete`, `required`, validation, or copy text unless a step explicitly says so. If a transformation seems to require a logic change, STOP and report.
- Do not modify `src/components/ds/*`, `src/components/ui/Logo.tsx`, or any file not listed in a task.
- Legacy `src/components/ui/Input.tsx` / `Button.tsx` remain (other pages import them).

---

### Task 1: AuthShell + AuthField

**Files:**
- Create: `src/components/merchant/AuthShell.tsx`

- [ ] **Step 1: Create `src/components/merchant/AuthShell.tsx`**

Two exports: `AuthShell` (layout) and `AuthField` (labelled/icon input over ds `Input` — the legacy `ui/Input` has `label`/`icon` props the ds primitive intentionally lacks, so this thin wrapper provides parity).

```tsx
'use client';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { Card, Input, type InputProps } from '@/components/ds';

export function AuthField({ label, icon, ...props }: InputProps & { label: string; icon?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-body-sm font-semibold text-ink mb-1.5">{label}</span>
      <span className="relative block">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" aria-hidden>
            {icon}
          </span>
        )}
        <Input {...props} className={icon ? 'pl-10' : undefined} />
      </span>
    </label>
  );
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-surface-page">
      {/* Brand panel (desktop only) */}
      <aside className="hidden lg:flex lg:w-[45%] relative bg-section-dark flex-col justify-between p-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute -top-24 right-[-20%] w-[560px] h-[380px]"
            style={{ background: 'radial-gradient(closest-side, rgba(13,148,136,.2), transparent)' }}
          />
        </div>
        <Link href="/" className="relative w-fit" aria-label="LetLoyal home">
          <Logo variant="dark" size={28} />
        </Link>
        <div className="relative">
          <h2 className="font-display font-extrabold text-4xl text-white tracking-[-0.025em] leading-[1.1]">
            Loyalty that brings them{' '}
            <em className="font-serif italic font-medium text-[#F2C230]">back.</em>
          </h2>
          <p className="text-[#AEBDB5] mt-4 max-w-sm leading-relaxed">
            One QR at your counter. Points land instantly, and your regulars become your growth engine.
          </p>
        </div>
        <p className="relative text-caption text-[#7C8C84]">© 2026 LetLoyal · India Pilot 🇮🇳</p>
      </aside>

      {/* Form column */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <Link href="/" className="inline-block" aria-label="LetLoyal home">
              <Logo variant="light" size={28} />
            </Link>
          </div>
          <div className="mb-4 text-center">
            <Link href="/" className="inline-flex items-center gap-1 text-caption text-ink-sub hover:text-teal transition-colors">
              <span>←</span> Back to home
            </Link>
          </div>
          <Card padding="lg">
            <h1 className="font-display font-bold text-h2 text-ink mb-1">{title}</h1>
            {subtitle && <p className="text-ink-faint text-body-sm mb-6">{subtitle}</p>}
            {children}
          </Card>
          {footer && <div className="mt-5 text-center text-body-sm text-ink-sub">{footer}</div>}
          <p className="mt-6 text-center text-caption text-ink-faint">Powered by LetLoyal</p>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `npm run build && npx tsc --noEmit` → PASS.

```bash
git add src/components/merchant/AuthShell.tsx
git commit -m "mrp: AuthShell with dark brand panel and AuthField"
```

---

### Task 2: Login page

**Files:**
- Modify: `src/app/merchant/login/page.tsx` (full replacement below — logic identical to current file)

- [ ] **Step 1: Replace `src/app/merchant/login/page.tsx` with:**

(Every hook, handler, fetch, redirect, and string is byte-identical to the current file; only presentation moved into AuthShell/AuthField/ds Button.)

```tsx
'use client';

import { useState, FormEvent, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ds';
import AuthShell, { AuthField } from '@/components/merchant/AuthShell';
import { Mail, Lock } from 'lucide-react';

function getSafeRedirect(redirect: string | null, defaultPath: string): string {
  if (!redirect) return defaultPath;
  try {
    if (redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect;
    }
    return defaultPath;
  } catch {
    return defaultPath;
  }
}

function MerchantLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('redirect');
  const justVerified   = searchParams.get('verified') === '1';
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (justVerified) setSuccess('Email verified! You can now sign in.');
  }, [justVerified]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/merchant/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsVerification && data.email) {
          router.push(`/merchant/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }
        setError(data.error || 'Login failed.');
        return;
      }

      router.push(getSafeRedirect(redirectTo, `/m/${data.slug}`));
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourbusiness.com"
          icon={<Mail size={16} />}
          required
          autoComplete="email"
        />

        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          icon={<Lock size={16} />}
          required
          autoComplete="current-password"
        />

        {success && (
          <div className="rounded-[11px] bg-good-subtle px-4 py-3 text-body-sm text-good font-semibold">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-body-sm text-bad font-semibold">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth loading={loading} className="mt-2">
          Sign In
        </Button>
      </form>

      <div className="mt-5 flex items-center justify-between text-body-sm">
        <Link href="/merchant/forgot" className="text-teal font-semibold hover:underline">
          Forgot your password?
        </Link>
        <Link href="/merchant/register" className="text-teal font-semibold hover:underline">
          Create account →
        </Link>
      </div>
    </>
  );
}

export default function MerchantLoginPage() {
  return (
    <AuthShell
      title="Merchant Login"
      subtitle="Sign in to your LetLoyal dashboard"
      footer={
        <p>
          Are you a customer?{' '}
          <Link href="/my-rewards" className="text-teal font-semibold hover:underline">
            View your rewards →
          </Link>
        </p>
      }
    >
      <Suspense fallback={<p className="text-body-sm text-ink-sub">Loading…</p>}>
        <MerchantLoginForm />
      </Suspense>
    </AuthShell>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `npm run build && npx tsc --noEmit` → PASS. In dev: `/merchant/login` shows brand panel (desktop) + card form; submitting wrong credentials shows the error box.

```bash
git add src/app/merchant/login/page.tsx
git commit -m "mrp: login page on AuthShell"
```

---

### Task 3: Register, forgot, reset, verify-email pages

**Files:**
- Modify: `src/app/merchant/register/page.tsx`, `src/app/merchant/forgot/page.tsx`, `src/app/merchant/reset/page.tsx`, `src/app/merchant/verify-email/page.tsx`

- [ ] **Step 1: Read all four pages fully.** They follow the same shape as login (page wrapper with logo + `.card` + `ui/Input`/`ui/Button`). Apply the SAME transformation used in Task 2 to each:

1. Imports: drop `Logo` and `@/components/ui/Input` / `@/components/ui/Button`; add `import { Button } from '@/components/ds';` and `import AuthShell, { AuthField } from '@/components/merchant/AuthShell';`.
2. Page wrapper (`<main className="min-h-screen …">` + logo block + back-link + "Powered by" caption) → `<AuthShell title={…} subtitle={…} footer={…}>`. `title`/`subtitle` come from the page's existing `h1` and its following `p` — text verbatim. Page-specific below-card links move into `footer` (classes → `text-teal font-semibold hover:underline`).
3. `<Input label=… icon=… …/>` → `<AuthField …/>` with identical props. If a page uses `ui/Input` props beyond `label/icon` + native ones (e.g. `error`), map: `error={x}` → `invalid={!!x}` on AuthField plus keep the message rendering where it is.
4. `ui/Button` → ds `Button`. Intent: **register's submit button gets `intent="reward"`** (acquisition CTA); all other pages keep default (teal primary). `fullWidth`/`loading`/`type` pass through. If a page used `variant="secondary"`, use `intent="secondary"`.
5. Success/error boxes → the exact patterns from Task 2 (`bg-good-subtle text-good` / `bg-bad-subtle text-bad`, `rounded-[11px]`).
6. Everything else — state, handlers, fetch URLs, redirects, timers, `Suspense` wrappers, copy — untouched.

- [ ] **Step 2: Verify each page compiles and renders**

Run: `npm run build && npx tsc --noEmit` → PASS. In dev, open all four routes; each shows the AuthShell layout.

- [ ] **Step 3: Behaviour-preservation self-check**

For each page run `git diff src/app/merchant/<page>/page.tsx` and confirm: no line containing `fetch(`, `router.`, `useState`, `useEffect`, `setInterval`, or a string literal changed except for the mechanical wrapper/class transformations above. Report any exception rather than committing it.

- [ ] **Step 4: Commit**

```bash
git add src/app/merchant/register/page.tsx src/app/merchant/forgot/page.tsx src/app/merchant/reset/page.tsx src/app/merchant/verify-email/page.tsx
git commit -m "mrp: register/forgot/reset/verify pages on AuthShell"
```

---

### Task 4: DashboardShell re-token

**Files:**
- Modify: `src/components/merchant/DashboardShell.tsx` (class swaps only; structure/props/handlers untouched)

- [ ] **Step 1: Apply these exact replacements throughout the file:**

| Old | New |
|---|---|
| root `flex h-screen bg-bg-muted overflow-hidden` | `flex h-screen bg-surface-page overflow-hidden` |
| desktop aside `bg-surface border-r border-border-light` | `bg-surface-1 border-r border-stroke` |
| logo block `border-b border-border-light` | `border-b border-stroke` |
| business name `text-text-dark` | `text-ink` |
| MerchantMark logo border `border-border-light` | `border-stroke` |
| MerchantMark fallback `bg-primary-light` / `text-primary` | `bg-teal-subtle` / `text-teal` |
| mobile drawer `bg-white` | `bg-surface-1` |
| mobile top bar `bg-surface border-b border-border-light` | `bg-surface-1 border-b border-stroke` |
| top bar / drawer icon+text `text-text-medium`, `text-text-dark` | `text-ink-sub`, `text-ink` |
| `hover:bg-bg-muted` (both buttons) | `hover:bg-surface-2` |
| sidebar footer `border-t border-border-light` | `border-t border-stroke` |

- [ ] **Step 2: Replace the nav-item classes** (inside the `nav.map`):

```tsx
className={clsx(
  'flex items-center gap-3 px-4 py-2.5 rounded-full text-body-sm font-semibold transition-colors',
  active
    ? 'bg-reward text-reward-fg font-bold'
    : 'text-ink-sub hover:bg-surface-2 hover:text-ink',
)}
```

- [ ] **Step 3: Replace the logout button classes:**

```tsx
className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full text-body-sm font-semibold text-ink-sub hover:bg-bad-subtle hover:text-bad transition-colors"
```

- [ ] **Step 4: Verify + commit**

Run: `npm run build && npx tsc --noEmit` → PASS. In dev, log into the demo merchant (`brewhouse-cafe` seed) and confirm: honey active pill tracks the current route, all 9 links work, mobile drawer opens/closes, legacy pages still render inside the shell.

```bash
git add src/components/merchant/DashboardShell.tsx
git commit -m "mrp: token-driven DashboardShell with honey active nav"
```

---

### Task 5: Dashboard home page

**Files:**
- Modify: `src/app/m/[slug]/page.tsx` (imports, `StatCard`, and the returned JSX; queries/helpers/auth untouched)

- [ ] **Step 1: Update imports** — add ds components, keep everything else:

```tsx
import { Badge, Card, EmptyState, Table, THead, TH, TBody, TR, TD } from '@/components/ds';
```

- [ ] **Step 2: Replace the `StatCard` helper with:**

```tsx
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card padding="sm" className="flex items-center gap-4">
      <div className="p-2.5 rounded-xl bg-teal-subtle text-teal flex-shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-display font-bold text-ink [font-variant-numeric:tabular-nums]">{value}</p>
        <p className="text-label uppercase text-ink-faint">{label}</p>
      </div>
    </Card>
  );
}
```

Then remove the `color="…"` prop from the four `<StatCard/>` usages (the prop no longer exists — TypeScript will enforce this).

- [ ] **Step 3: Replace the returned JSX blocks** (LiveClock line and all data expressions stay identical):

QR banner:
```tsx
<Link
  href={`/m/${slug}/qr`}
  className="flex items-center gap-4 bg-teal hover:bg-teal-hover transition-colors text-teal-fg rounded-[16px] px-5 py-4 shadow-ds"
>
  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
    <QrCode size={26} />
  </div>
  <div className="flex-1">
    <p className="font-display font-bold text-lg leading-tight">Generate QR Code</p>
    <p className="opacity-80 text-body-sm">Show QR to customer to earn stamps</p>
  </div>
  <ArrowRight size={20} className="opacity-70 flex-shrink-0" />
</Link>
```

Campaign card (data expressions identical; dark green-ink panel replaces the hardcoded gradient):
```tsx
{campaign ? (
  <div className="rounded-[16px] bg-section-dark p-5 shadow-ds">
    <p className="text-label uppercase text-[#9FE7CC] mb-2">Running Campaign</p>
    <div className="flex items-start justify-between gap-2">
      <h2 className="text-xl font-display font-bold text-white">{campaign.name}</h2>
      <span className="text-2xl font-display font-bold text-white [font-variant-numeric:tabular-nums]">{campaign.member_count}</span>
    </div>
    <p className="text-[#AEBDB5] text-body-sm mt-1 flex items-center gap-1">
      <Gift size={14} className="text-[#F2C230]" />
      {campaign.reward_description}
    </p>
    <p className="text-caption text-[#7C8C84] mt-1">
      {campaign.campaign_type === 'spend_based'
        ? `₹${campaign.reward_threshold} spend to unlock`
        : `${campaign.reward_threshold} visits to unlock`}
    </p>
    <div className="flex items-center justify-between mt-4">
      <span className="text-caption text-[#7C8C84]">{campaign.member_count} members</span>
      <span className="text-caption text-[#F2C230] font-semibold">{campaign.redeemed_count} redeemed</span>
    </div>
  </div>
) : (
  <EmptyState
    title="No active campaign"
    description="Create one to start rewarding customers"
    action={
      <Link href={`/m/${slug}/campaign`} className="inline-flex items-center rounded-full bg-teal text-teal-fg font-bold text-body-sm px-5 py-2.5 hover:bg-teal-hover transition-colors">
        Create Campaign
      </Link>
    }
  />
)}
```

Recent Transactions (ds Table; same data, same `displayName`/`isEarn`/`timeAgo` logic):
```tsx
<Card padding="md">
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-display font-bold text-h4 text-ink">Recent Transactions</h2>
    <span className="text-caption text-ink-faint flex items-center gap-1">
      <Clock size={12} /> Updated just now
    </span>
  </div>

  {recentVisits.length === 0 ? (
    <div className="text-center py-8 text-ink-faint">
      <QrCode size={32} className="mx-auto mb-2 opacity-30" />
      <p className="text-body-sm">No transactions yet</p>
      <p className="text-caption mt-1">Show QR code to start scanning</p>
    </div>
  ) : (
    <Table density="compact">
      <THead>
        <TR><TH>Customer</TH><TH>Points</TH><TH>When</TH></TR>
      </THead>
      <TBody>
        {recentVisits.map((v, i) => {
          const displayName = v.customer_name || maskPhone(v.phone_number);
          const isEarn = v.points_added > 0;
          return (
            <TR key={i}>
              <TD density="compact" className="font-semibold text-ink">{displayName}</TD>
              <TD density="compact" className={isEarn ? 'text-good font-bold' : 'text-bad font-bold'}>
                {isEarn ? '+' : ''}{v.points_added}
                {campaign?.campaign_type === 'spend_based' ? 'pt' : ' visit'}
              </TD>
              <TD density="compact" className="text-ink-faint">{timeAgo(v.created_at)}</TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  )}
</Card>
```

Insights (honey callout for pending redeems, teal for close-to-reward; counts/pluralisation strings identical):
```tsx
{(closeToReward.length > 0 || pendingRedeems.length > 0) && (
  <Card padding="md">
    <div className="flex items-center gap-2 mb-4">
      <Bell size={18} className="text-teal" />
      <h2 className="font-display font-bold text-h4 text-ink">Customer Insights</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {pendingRedeems.length > 0 && (
        <Link href={`/m/${slug}/redeem`}>
          <div className="flex items-start gap-3 p-3 rounded-[11px] bg-reward-subtle border border-reward/40 hover:brightness-[0.98] transition-[filter] cursor-pointer">
            <Gift size={20} className="text-reward-deep mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-body-sm font-bold text-reward-deep">Rewards Waiting to Redeem</p>
                <Badge intent="reward" dot={false}>HIGH</Badge>
              </div>
              <p className="text-caption text-ink-sub mt-0.5">
                {pendingRedeems.length} customer{pendingRedeems.length > 1 ? 's' : ''} ha{pendingRedeems.length > 1 ? 've' : 's'} an unlocked reward waiting.
              </p>
            </div>
            <ArrowRight size={16} className="text-reward-deep mt-0.5 flex-shrink-0" />
          </div>
        </Link>
      )}

      {closeToReward.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-[11px] bg-teal-subtle border border-teal/20">
          <Star size={20} className="text-teal mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-body-sm font-bold text-teal">Customers Close to Reward</p>
              <Badge intent="teal" dot={false}>HIGH</Badge>
            </div>
            <p className="text-caption text-ink-sub mt-0.5">
              {closeToReward.length} customer{closeToReward.length > 1 ? 's are' : ' is'} 75%+ of the way to unlocking their reward.
            </p>
          </div>
        </div>
      )}
    </div>
  </Card>
)}
```

Quick actions (destinations identical):
```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
  {[
    { label: 'Customers', href: `/m/${slug}/customers`, icon: <Users size={18} /> },
    { label: 'Validate',  href: `/m/${slug}/validate`,  icon: <ShieldCheck size={18} /> },
    { label: 'Feedback',  href: `/m/${slug}/feedback`,  icon: <Star size={18} /> },
    { label: 'Campaign',  href: `/m/${slug}/campaign`,  icon: <Gift size={18} /> },
  ].map(({ label, href, icon }) => (
    <Link
      key={href}
      href={href}
      className="rounded-[16px] border border-stroke bg-surface-1 shadow-ds flex flex-col items-center gap-2 py-5 hover:bg-teal-subtle hover:border-teal/20 transition-colors text-center group"
    >
      <span className="text-teal group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-body-sm font-semibold text-ink-sub group-hover:text-teal">{label}</span>
    </Link>
  ))}
</div>
```

The stat-card grid wrapper and `<LiveClock …/>` line stay exactly as they are.

- [ ] **Step 4: Verify + commit**

Run: `npm run build && npx tsc --noEmit` → PASS. In dev, dashboard renders with seeded data: 4 KPI cards, teal QR banner, campaign panel (or EmptyState), transactions table, insights callouts, quick actions.

```bash
git add "src/app/m/[slug]/page.tsx"
git commit -m "mrp: dashboard home in Teal & Honey (KPIs, honey callout, ds table)"
```

---

### Task 6: Final verification + deploy gate

**Files:** none

- [ ] **Step 1:** `npm run build && npm run lint && npm run check:contrast` — all pass (lint: only the pre-existing LocationPicker warning).

- [ ] **Step 2: Browser sweep** (dev server, demo merchant seed credentials from `db/seed-demo.ts`):
- `/merchant/login`: brand panel on desktop, single column at 375px; wrong password → error box; correct login → dashboard.
- Dashboard: all sections render with data; honey active pill on "Dashboard"; click through all 9 nav items — legacy pages render fine inside the re-tokened shell; mobile drawer works.
- `/merchant/register`, `/forgot`, `/reset`, `/verify-email`: render in AuthShell.

- [ ] **Step 3: Deploy gate (STOP — requires user confirmation).** `git remote -v` must show `Jaison650/letloyal-production`. Ask the user before `git push origin master` + VPS `./deploy.sh` + PM2/live verification.

---

## Self-review notes

- **Spec coverage:** AuthShell (T1), 5 auth pages (T2–3, register honey CTA per spec §3), shell re-token incl. honey pill + logout + MerchantMark (T4), dashboard home incl. KPI cards / honey callout / ds Table / campaign panel / EmptyState (T5), verification + gated deploy (T6). Theme toggle intentionally absent. Legacy classes left in globals.css.
- **Deviation from spec noted:** spec's "teal progress bar with honey fill at 100%" — the current dashboard has no campaign progress bar (progress lives per-customer); the campaign panel shows member/redeemed counts. No bar is added (YAGNI, presentation-only rule wins). Spec's campaign-panel intent is honoured via the dark green-ink panel with mint/honey accents.
- **Type consistency:** `AuthField` extends ds `InputProps`; ds `Button` props (`intent`, `fullWidth`, `loading`) match Task D of Phase 0; `Table density="compact"` + per-`TD` density matches the ds Table API.
- **Placeholder scan:** Task 3 is recipe-based over four files the executor must read first — every mapping is exact and the behaviour-preservation check (Step 3) is mechanical, mirroring the legal-pages approach that worked in Phase 1.
