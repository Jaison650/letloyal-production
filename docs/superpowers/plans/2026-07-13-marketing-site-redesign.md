# Marketing Site Redesign ("Teal & Honey" Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the letloyal.in homepage and 6 legal pages in the Teal & Honey design language using the Phase-0 token system and `src/components/ds/` library.

**Architecture:** The 391-line `src/app/page.tsx` decomposes into section components under `src/components/marketing/sections/`, composed by a ~30-line server `page.tsx`. Shared `MarketingNav` (tone-aware: glassy on the dark hero, light elsewhere), `MarketingFooter`, and `LegalLayout`. Dark bands (`hero`, `LiveDemo`, `FinalCta`, footer) are theme-independent fixed palettes on `bg-section-dark`; light sections use tokens exclusively.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind 3.4 (tokens from Phase 0), framer-motion, lucide-react, `@/components/ds`.

**Spec:** `docs/superpowers/specs/2026-07-13-marketing-site-redesign-design.md`

**Conventions for every task:**
- Repo root `letloyal-production`, branch `master`. Verify `git remote -v` shows `Jaison650/letloyal-production` before ANY push; do not push until the final task and only with explicit user approval.
- Commit prefix `mkt:`. `npm run build` must pass before every commit.
- No unit-test framework exists; verification = build + browser sweep (final task) + contrast script.
- Do not modify `src/components/ds/*` or `src/components/ui/Logo.tsx`. Existing legacy CTA destinations must not change: `/merchant/register`, `/merchant/login`, `/my-rewards`, `#how-it-works`, `#faq`.
- Copy rule: TESTIMONIALS and FAQ content are verbatim from the existing site — do not rewrite quotes or answers.
- The dark-band fixed palette (used only inside dark bands): band bg `bg-section-dark` (`#0E1A17` via token), primary text `text-white`, secondary `text-[#AEBDB5]`, tertiary `text-[#7C8C84]`, mint accent `text-[#9FE7CC]` / borders `border-[#5EEAD4]/20`, honey `#F2C230`, glass panels `bg-white/[0.06] border-white/10`.

---

### Task 1: Motion helpers + MarketingFooter

**Files:**
- Create: `src/components/marketing/motion.tsx`
- Create: `src/components/marketing/MarketingFooter.tsx`

- [ ] **Step 1: Create `src/components/marketing/motion.tsx`** (moved from page.tsx so all sections share it)

```tsx
'use client';
import { motion } from 'framer-motion';

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const staggerContainer = (stagger = 0.1) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger } },
});

export function FadeUp({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Create `src/components/marketing/MarketingFooter.tsx`** (server component; content/links identical to the current footer in `page.tsx:343-388`, restyled to the green-ink band)

```tsx
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Product',
    links: [
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  {
    heading: 'For Customers',
    links: [{ label: 'My Rewards', href: '/my-rewards' }],
  },
  {
    heading: 'Merchant',
    links: [
      { label: 'Create Account', href: '/merchant/register' },
      { label: 'Merchant Login', href: '/merchant/login' },
      { label: 'Merchant Terms', href: '/merchant-terms' },
      { label: 'Merchant Rights', href: '/merchant-rights' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
      { label: 'Customer Privacy', href: '/customer-policy' },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="bg-section-dark text-[#AEBDB5] py-14 px-4 border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
          <div>
            <div className="mb-3"><Logo variant="dark" size={26} /></div>
            <p className="text-sm max-w-xs leading-relaxed">
              QR-first loyalty for local merchants.<br />No app. No hardware. Just loyal customers.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="font-display font-bold text-white mb-3">{col.heading}</p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="hover:text-[#9FE7CC] transition-colors">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-xs text-center text-[#7C8C84]">
          © 2026 LetLoyal. India Pilot. 🇮🇳
        </div>
      </div>
    </footer>
  );
}
```

(Note the Product links are `/#how-it-works` — absolute with slash — so they work from legal pages too; the current footer's `#how-it-works` breaks off-homepage. This is an intentional fix.)

- [ ] **Step 3: Build + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/marketing/motion.tsx src/components/marketing/MarketingFooter.tsx
git commit -m "mkt: shared motion helpers and dark-band footer"
```

---

### Task 2: MarketingNav (tone-aware)

**Files:**
- Create: `src/components/marketing/MarketingNav.tsx`

- [ ] **Step 1: Create `src/components/marketing/MarketingNav.tsx`** (behaviour from HomeNav — sticky, scroll state, mobile menu — restyled; `tone="onDark"` starts glassy over the dark hero and flips to light on scroll; `tone="light"` is always the light style)

```tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

const NAV_LINKS = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'FAQ', href: '/#faq' },
];

export default function MarketingNav({ tone = 'onDark' }: { tone?: 'onDark' | 'light' }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handle, { passive: true });
    handle();
    return () => window.removeEventListener('scroll', handle);
  }, []);

  const light = tone === 'light' || scrolled || mobileOpen;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300 border-b',
        light
          ? 'bg-surface-1/85 backdrop-blur-md border-stroke shadow-ds'
          : 'bg-transparent border-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0" aria-label="LetLoyal home">
          <Logo variant={light ? 'light' : 'dark'} size={26} />
        </Link>
        <nav className={cn('hidden md:flex items-center gap-6 text-body-sm font-semibold', light ? 'text-ink-sub' : 'text-[#AEBDB5]')}>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className={cn('transition-colors', light ? 'hover:text-teal' : 'hover:text-white')}>
              {l.label}
            </a>
          ))}
          <Link href="/my-rewards" className={cn('transition-colors', light ? 'hover:text-teal' : 'hover:text-white')}>
            For Customers
          </Link>
        </nav>
        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/merchant/login"
            className={cn(
              'rounded-full px-5 py-2 text-body-sm font-bold border transition-colors',
              light
                ? 'border-stroke-strong text-ink hover:bg-surface-2'
                : 'border-white/20 bg-white/[0.08] text-white hover:bg-white/[0.14]'
            )}
          >
            Merchant Login
          </Link>
          <Link
            href="/merchant/register"
            className="rounded-full px-5 py-2 text-body-sm font-bold bg-reward text-reward-fg hover:brightness-95 transition-[filter]"
          >
            Get Started Free
          </Link>
        </div>
        <button
          className={cn('md:hidden p-2', light ? 'text-ink-sub' : 'text-white')}
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-surface-1/95 backdrop-blur-md border-t border-stroke"
          >
            <nav className="px-5 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="py-2.5 text-body font-semibold text-ink-sub hover:text-teal">
                  {l.label}
                </a>
              ))}
              <Link href="/my-rewards" onClick={() => setMobileOpen(false)} className="py-2.5 text-body font-semibold text-ink-sub hover:text-teal">
                For Customers
              </Link>
              <div className="flex gap-2 pt-3 pb-1">
                <Link href="/merchant/login" className="flex-1 text-center rounded-full px-4 py-2.5 text-body-sm font-bold border border-stroke-strong text-ink">
                  Merchant Login
                </Link>
                <Link href="/merchant/register" className="flex-1 text-center rounded-full px-4 py-2.5 text-body-sm font-bold bg-reward text-reward-fg">
                  Get Started Free
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
```

- [ ] **Step 2: Build + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/marketing/MarketingNav.tsx
git commit -m "mkt: tone-aware marketing nav (glassy on dark hero, light on scroll)"
```

---

### Task 3: Hero section

**Files:**
- Create: `src/components/marketing/sections/Hero.tsx`

- [ ] **Step 1: Create `src/components/marketing/sections/Hero.tsx`**

Dark band; nav sits on top of it (page places `<MarketingNav/>` before it — the band starts at the very top under the sticky transparent nav, so the band includes `-mt-16 pt-16` compensation). Headline with Fraunces italic honey flourish; honey + glass CTAs; restyled 3-card hero visual (dark glass).

```tsx
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Coffee, ArrowRight, Users } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { fadeUp, staggerContainer } from '../motion';

export default function Hero() {
  return (
    <section className="relative bg-section-dark -mt-16 pt-16 overflow-hidden">
      {/* radial glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-24 right-[-10%] w-[700px] h-[420px]" style={{ background: 'radial-gradient(closest-side, rgba(13,148,136,.22), transparent)' }} />
        <div className="absolute bottom-[-20%] left-[-8%] w-[480px] h-[300px]" style={{ background: 'radial-gradient(closest-side, rgba(242,184,36,.07), transparent)' }} />
      </div>

      <div className="max-w-5xl mx-auto text-center relative px-4 pt-16 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 text-[#9FE7CC] font-semibold text-body-sm px-4 py-2 rounded-full mb-7 border border-[#5EEAD4]/20 bg-[#5EEAD4]/[0.07]"
        >
          ● QR-simple loyalty · no app needed
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.06] tracking-[-0.03em] text-white mb-6"
        >
          Customers who keep{' '}
          <em className="font-serif italic font-medium text-[#F2C230] tracking-[-0.01em]">coming back.</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="text-lg sm:text-xl text-[#AEBDB5] max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          One QR at your counter. Points land instantly, rewards redeem themselves,
          and your regulars become your growth engine.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.26 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/merchant/register" className="inline-flex items-center gap-2 rounded-full bg-reward text-reward-fg font-bold text-lg px-9 py-4 hover:brightness-95 transition-[filter]">
            Start free — 2 min setup <ArrowRight size={18} />
          </Link>
          <a href="#how-it-works" className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.08] text-white font-bold text-lg px-8 py-4 hover:bg-white/[0.14] transition-colors">
            See how it works
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.38 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-5 text-body-sm text-[#7C8C84] font-medium"
        >
          <span>Trusted by merchants across</span>
          <span className="flex items-center gap-1.5 text-[#AEBDB5]">🇮🇳 India</span>
          <span className="text-white/15">·</span>
          <span className="flex items-center gap-1.5 text-[#9FE7CC] font-semibold"><Users size={14} /> India Pilot</span>
        </motion.div>

        {/* Hero visual — dark glass cards */}
        <motion.div variants={staggerContainer(0.15)} initial="hidden" animate="show" className="mt-16 flex flex-col lg:flex-row items-center justify-center gap-6 max-w-4xl mx-auto">
          <motion.div variants={fadeUp} className="bg-white/[0.06] backdrop-blur-sm rounded-[16px] border border-white/10 p-5 w-full max-w-xs text-left animate-float">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#6B3F2A] flex items-center justify-center"><Coffee size={14} className="text-white" /></div>
              <div>
                <p className="font-display font-bold text-sm text-white">BrewHouse Café</p>
                <p className="text-xs text-[#7C8C84]">Live Dashboard</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[{ label: 'Scans Today', val: '14' }, { label: 'Active Customers', val: '87' }].map((s) => (
                <div key={s.label} className="bg-white/[0.07] rounded-xl p-3">
                  <p className="text-xl font-display font-bold text-[#5EEAD4]">{s.val}</p>
                  <p className="text-xs text-[#7C8C84]">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-3/4 rounded-full" style={{ background: 'linear-gradient(90deg,#5EEAD4,#0D9488)' }} />
            </div>
            <p className="text-xs text-[#7C8C84] mt-1">Campaign progress</p>
          </motion.div>

          <motion.div variants={fadeUp} className="relative shrink-0">
            <div className="bg-gradient-brand rounded-3xl px-6 py-5 flex items-center justify-center shadow-xl animate-pulse-glow">
              <Logo variant="dark" size={38} />
            </div>
            <div className="absolute -top-3 -right-3 bg-reward text-reward-fg text-xs font-bold px-2 py-1 rounded-full">SCAN</div>
          </motion.div>

          <motion.div variants={fadeUp} className="bg-white/[0.06] backdrop-blur-sm rounded-[16px] border border-[#F2C230]/30 p-5 w-full max-w-xs text-left animate-float" style={{ animationDelay: '1s' }}>
            <p className="font-display font-bold text-sm text-white mb-1">Priya S.</p>
            <p className="text-xs text-[#7C8C84] mb-3">BrewHouse Café · 8/10 visits</p>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full w-4/5 rounded-full" style={{ background: 'linear-gradient(90deg,#F2C230,#E8A50F)' }} />
            </div>
            <p className="text-xs text-[#F2C230] font-semibold">2 more visits to Free Coffee! ☕</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/marketing/sections/Hero.tsx
git commit -m "mkt: dark-band hero with serif flourish and honey CTA"
```

---

### Task 4: SocialProof + Problem sections

**Files:**
- Create: `src/components/marketing/sections/SocialProof.tsx`
- Create: `src/components/marketing/sections/Problem.tsx`

- [ ] **Step 1: Create `src/components/marketing/sections/SocialProof.tsx`** (marquee strip re-tokened; server component — no motion hooks, CSS animation only)

```tsx
import { Coffee, Scissors, Dumbbell, ShoppingBag, Pizza, Sparkles } from 'lucide-react';

const TYPES = [
  { icon: Coffee, label: 'Cafés' },
  { icon: Scissors, label: 'Salons' },
  { icon: Dumbbell, label: 'Gyms' },
  { icon: ShoppingBag, label: 'Retail' },
  { icon: ShoppingBag, label: 'Boutiques' },
  { icon: Pizza, label: 'Restaurants' },
  { icon: Sparkles, label: 'Spas' },
];

export default function SocialProof() {
  return (
    <div className="relative bg-surface-2/60 border-y border-stroke py-4 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-surface-page to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-surface-page to-transparent z-10 pointer-events-none" />
      <div className="flex animate-marquee whitespace-nowrap gap-10">
        {[...Array(2)].map((_, k) => (
          <span key={k} className="flex items-center gap-10 text-body-sm font-semibold text-ink-sub">
            {TYPES.map((t, i) => (
              <span key={`${t.label}-${i}`} className="flex items-center gap-10">
                <span className="flex items-center gap-2"><t.icon size={14} className="text-teal" /> {t.label}</span>
                <span className="text-ink-faint">·</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/marketing/sections/Problem.tsx`** (lucide icons replace emoji; content otherwise verbatim)

```tsx
'use client';
import { motion } from 'framer-motion';
import { BarChart3, RotateCcw, Trophy } from 'lucide-react';
import { Card } from '@/components/ds';
import { fadeUp, staggerContainer, FadeUp } from '../motion';

const PROBLEMS = [
  { icon: BarChart3, title: 'Zero Data', desc: 'Paper cards give you no insight into who your loyal customers are or how often they return.' },
  { icon: RotateCcw, title: 'Cards Get Lost', desc: 'Customers forget them, lose them, start over — and your loyalty program resets every time.' },
  { icon: Trophy, title: 'No Competitive Edge', desc: 'While you hand out stamps, competitors run digital loyalty programs that drive real retention.' },
];

export default function Problem() {
  return (
    <section className="py-24 px-4 bg-surface-page">
      <div className="max-w-5xl mx-auto text-center">
        <FadeUp>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-[-0.02em] mb-4">Paper stamp cards are killing your retention</h2>
          <p className="text-ink-sub text-lg mb-14">Three reasons local businesses lose loyal customers every day.</p>
        </FadeUp>
        <motion.div variants={staggerContainer(0.12)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} className="grid md:grid-cols-3 gap-6">
          {PROBLEMS.map((p) => (
            <motion.div key={p.title} variants={fadeUp}>
              <Card padding="lg" className="text-left h-full hover:-translate-y-1 transition-transform duration-200">
                <div className="w-11 h-11 bg-surface-2 rounded-xl flex items-center justify-center text-ink-sub mb-4"><p.icon size={22} /></div>
                <h3 className="font-display font-bold text-h3 text-ink mb-2">{p.title}</h3>
                <p className="text-ink-sub">{p.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Build + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/marketing/sections/SocialProof.tsx src/components/marketing/sections/Problem.tsx
git commit -m "mkt: social-proof marquee and problem sections"
```

---

### Task 5: HowItWorks + Features sections

**Files:**
- Create: `src/components/marketing/sections/HowItWorks.tsx`
- Create: `src/components/marketing/sections/Features.tsx`

- [ ] **Step 1: Create `src/components/marketing/sections/HowItWorks.tsx`** (keeps `id="how-it-works"`)

```tsx
'use client';
import { motion } from 'framer-motion';
import { Settings2, Scan, TrendingUp } from 'lucide-react';
import { FadeUp } from '../motion';

const STEPS = [
  { num: '01', icon: Settings2, title: 'Set Up Your Program', desc: 'Sign up, choose visit-based or spend-based rewards, and set your threshold. Your QR code is ready instantly.' },
  { num: '02', icon: Scan, title: 'Display Your QR', desc: 'Print it, frame it, or show it on your phone. Customers scan and automatically join — no app needed.' },
  { num: '03', icon: TrendingUp, title: 'Watch Customers Return', desc: "Your dashboard shows who's earning, who's close to a reward, and your real re-scan rate." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-surface-1">
      <div className="max-w-5xl mx-auto text-center">
        <FadeUp>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-[-0.02em] mb-4">Up and running in 3 steps</h2>
          <p className="text-ink-sub text-lg mb-16">From signup to your first customer scan in under 10 minutes.</p>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:flex absolute top-10 left-[calc(33%+20px)] right-[calc(33%+20px)] items-center justify-between" aria-hidden>
            <div className="flex-1 h-0.5 bg-stroke" />
          </div>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: i === 0 ? -40 : i === 2 ? 40 : 0, y: i === 1 ? 20 : 0 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-teal rounded-2xl flex items-center justify-center text-teal-fg mb-5 shadow-ds relative z-10"><step.icon size={28} /></div>
              <p className="text-label uppercase text-teal mb-2">{step.num}</p>
              <h3 className="font-display font-bold text-h3 text-ink mb-3">{step.title}</h3>
              <p className="text-ink-sub leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/components/marketing/sections/Features.tsx`** (the campaigns feature gets reward styling — honey only where reward-meaning exists)

```tsx
'use client';
import { motion } from 'framer-motion';
import { Sparkles, Smartphone, Target, BarChart3, MapPin, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ds';
import { fadeUp, staggerContainer, FadeUp } from '../motion';

const FEATURES = [
  { icon: Sparkles, reward: false, title: 'Live in 10 Minutes', desc: 'No complex setup, no POS integration, no hardware required.' },
  { icon: Smartphone, reward: false, title: 'No App for Customers', desc: 'Customers scan with any phone camera — instant loyalty, zero friction.' },
  { icon: Target, reward: true, title: 'Visit & Spend Campaigns', desc: 'Run stamp-style or points-based rewards, or both simultaneously.' },
  { icon: BarChart3, reward: false, title: 'Live Dashboard', desc: "See today's scans, active customers, and redemptions in real time." },
  { icon: MapPin, reward: false, title: 'Multi-Location Ready', desc: 'One customer account works across all your locations seamlessly.' },
  { icon: ShieldCheck, reward: false, title: 'Privacy First', desc: 'Customer data is never sold or shared. Privacy-first by design.' },
];

export default function Features() {
  return (
    <section className="py-24 px-4 bg-surface-page">
      <div className="max-w-5xl mx-auto">
        <FadeUp className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-[-0.02em] mb-4">Everything you need. Nothing you don&apos;t.</h2>
          <p className="text-ink-sub text-lg">Built specifically for local merchants.</p>
        </FadeUp>
        <motion.div variants={staggerContainer(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={fadeUp}>
              <Card padding="lg" className="h-full hover:-translate-y-1 transition-transform duration-200">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.reward ? 'bg-reward-subtle text-reward-deep' : 'bg-teal-subtle text-teal'}`}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-display font-bold text-h4 text-ink mb-2">{f.title}</h3>
                <p className="text-ink-sub text-body-sm leading-relaxed">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Build + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/marketing/sections/HowItWorks.tsx src/components/marketing/sections/Features.tsx
git commit -m "mkt: how-it-works and features sections"
```

---

### Task 6: CampaignTypes + LiveDemo sections

**Files:**
- Create: `src/components/marketing/sections/CampaignTypes.tsx`
- Create: `src/components/marketing/sections/LiveDemo.tsx`

- [ ] **Step 1: Create `src/components/marketing/sections/CampaignTypes.tsx`** (visit-based = teal; spend-based = honey/reward)

```tsx
'use client';
import { motion } from 'framer-motion';
import { RotateCcw, Gift } from 'lucide-react';
import { Card } from '@/components/ds';
import { fadeUp, staggerContainer, FadeUp } from '../motion';

export default function CampaignTypes() {
  return (
    <section className="py-24 px-4 bg-surface-1">
      <div className="max-w-5xl mx-auto text-center">
        <FadeUp>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-[-0.02em] mb-4">Two proven loyalty models</h2>
          <p className="text-ink-sub text-lg mb-14">Choose the one that fits your business — or run both.</p>
        </FadeUp>
        <motion.div variants={staggerContainer(0.15)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} className="grid md:grid-cols-2 gap-6">
          <motion.div variants={fadeUp}>
            <Card padding="lg" className="text-left h-full border-teal/20 hover:border-teal transition-colors duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-subtle rounded-xl flex items-center justify-center text-teal"><RotateCcw size={20} /></div>
                <div>
                  <p className="font-display font-bold text-h4 text-ink">Stamp Card — Reimagined</p>
                  <p className="text-caption text-ink-faint">Visit-based</p>
                </div>
              </div>
              <p className="text-ink-sub mb-4">Reward customers for every visit. Classic loyalty, made digital. Perfect for cafés, salons, and gyms.</p>
              <div className="bg-teal-subtle rounded-xl p-4 mb-4">
                <p className="text-caption font-semibold text-ink-sub mb-2">Example:</p>
                <p className="font-display font-bold text-teal">Visit 10 times → Free coffee</p>
                <div className="mt-3 flex gap-1.5">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className={`flex-1 h-3 rounded-full ${i < 7 ? 'bg-teal' : 'bg-surface-2'}`} />
                  ))}
                </div>
                <p className="text-caption text-ink-faint mt-2">7 / 10 visits</p>
              </div>
              <p className="text-caption text-ink-sub"><strong>Ideal for:</strong> Coffee shops · Salons · Gyms · Barbers</p>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card padding="lg" className="text-left h-full border-reward/40 hover:border-reward transition-colors duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-reward-subtle rounded-xl flex items-center justify-center text-reward-deep"><Gift size={20} /></div>
                <div>
                  <p className="font-display font-bold text-h4 text-ink">Spend to Earn</p>
                  <p className="text-caption text-ink-faint">Spend-based</p>
                </div>
              </div>
              <p className="text-ink-sub mb-4">Customers earn points on every purchase. Perfect for restaurants and retail where basket size matters.</p>
              <div className="bg-reward-subtle rounded-xl p-4 mb-4">
                <p className="text-caption font-semibold text-ink-sub mb-2">Example:</p>
                <p className="font-display font-bold text-reward-deep">Spend ₹1000 → Get ₹100 reward</p>
                <div className="mt-3 h-3 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 rounded-full bg-reward" />
                </div>
                <p className="text-caption text-ink-faint mt-2">750 / 1000 points</p>
              </div>
              <p className="text-caption text-ink-sub"><strong>Ideal for:</strong> Restaurants · Retail · Boutiques · Spas</p>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/components/marketing/sections/LiveDemo.tsx`** (dark band; existing `/merchant/login` card links kept)

```tsx
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Coffee, ChevronRight } from 'lucide-react';
import { fadeUp, staggerContainer, FadeUp } from '../motion';

const DEMO_MERCHANTS = [
  { slug: 'brewhouse-cafe', name: 'BrewHouse Café', color: '#6B3F2A', reward: '10 visits → Free Coffee' },
  { slug: 'bella-beauty', name: 'Bella Beauty', color: '#7B2D8B', reward: '8 visits → Free Treatment' },
  { slug: 'the-fit-club', name: 'The Fit Club', color: '#1A6B2F', reward: '12 visits → Free PT Session' },
  { slug: 'metro-deli', name: 'Metro Deli', color: '#D4820A', reward: '₹1000 spent → ₹100 off' },
  { slug: 'luxe-boutique', name: 'Luxe Boutique', color: '#C0392B', reward: '₹2000 spent → ₹200 Voucher' },
  { slug: 'casa-pizzeria', name: 'Casa Pizzeria', color: '#E65C00', reward: '₹800 spent → Free Pizza' },
];

export default function LiveDemo() {
  return (
    <section className="relative py-24 px-4 bg-section-dark overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[-30%] left-[15%] w-[600px] h-[380px]" style={{ background: 'radial-gradient(closest-side, rgba(13,148,136,.16), transparent)' }} />
      </div>
      <div className="max-w-5xl mx-auto text-center relative">
        <FadeUp>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-[-0.02em] mb-4">See it in action</h2>
          <p className="text-[#AEBDB5] text-lg mb-12">Explore what LetLoyal looks like for your business — sign in to see the live dashboard.</p>
        </FadeUp>
        <motion.div variants={staggerContainer(0.07)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          {DEMO_MERCHANTS.map((m) => (
            <motion.div key={m.slug} variants={fadeUp}>
              <Link href="/merchant/login" className="block bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-[16px] p-4 text-left transition-all duration-200 hover:-translate-y-1">
                <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{ background: m.color }}>
                  <Coffee size={16} className="text-white" />
                </div>
                <p className="font-display font-bold text-sm text-white">{m.name}</p>
                <p className="text-[#F2C230] text-xs mt-1 font-semibold">{m.reward}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/merchant/register" className="inline-flex items-center justify-center gap-1 rounded-full bg-reward text-reward-fg font-bold text-lg px-10 py-4 hover:brightness-95 transition-[filter]">
            Get Started Free <ChevronRight size={18} />
          </Link>
          <Link href="/my-rewards" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white font-bold text-lg px-8 py-4 hover:bg-white/[0.14] transition-colors">
            View My Rewards
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Build + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/marketing/sections/CampaignTypes.tsx src/components/marketing/sections/LiveDemo.tsx
git commit -m "mkt: campaign types and live-demo dark band sections"
```

---

### Task 7: Testimonials + Faq + FinalCta sections, FaqAccordion re-token

**Files:**
- Create: `src/components/marketing/sections/Testimonials.tsx`
- Create: `src/components/marketing/sections/Faq.tsx`
- Create: `src/components/marketing/sections/FinalCta.tsx`
- Modify: `src/components/homepage/FaqAccordion.tsx` (class swap only — content untouched)

- [ ] **Step 1: Create `src/components/marketing/sections/Testimonials.tsx`** (quotes VERBATIM; stars honey; Fraunces quote mark)

```tsx
'use client';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, Badge } from '@/components/ds';
import { fadeUp, staggerContainer, FadeUp } from '../motion';

const TESTIMONIALS = [
  { name: 'Rahul M.', role: 'Café Owner, Bengaluru', quote: 'I had my QR code live in 8 minutes. The first week, 12 customers signed up. My regulars now ask me about their points.' },
  { name: 'Priya L.', role: 'Salon Manager, Mumbai', quote: 'Paper stamp cards were a nightmare — customers lost them, started over constantly. LetLoyal solved all of that overnight.' },
  { name: 'Arjun P.', role: 'Gym Owner, Hyderabad', quote: 'The dashboard shows me exactly who is close to a reward. I can push them over the line with a personal message. Brilliant.' },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-4 bg-surface-1">
      <div className="max-w-5xl mx-auto text-center">
        <FadeUp>
          <div className="mb-6"><Badge intent="reward">India Pilot Merchants</Badge></div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-[-0.02em] mb-14">What merchants are saying</h2>
        </FadeUp>
        <motion.div variants={staggerContainer(0.12)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <motion.div key={t.name} variants={fadeUp}>
              <Card padding="lg" className="text-left h-full">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#F2B824" stroke="#F2B824" />)}
                </div>
                <p className="text-ink leading-relaxed mb-5">
                  <span className="font-serif italic text-2xl text-reward-deep leading-none mr-0.5" aria-hidden>“</span>
                  {t.quote}
                  <span className="font-serif italic text-2xl text-reward-deep leading-none ml-0.5" aria-hidden>”</span>
                </p>
                <div>
                  <p className="font-semibold text-body-sm text-ink">{t.name}</p>
                  <p className="text-caption text-ink-faint">{t.role}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Re-token `src/components/homepage/FaqAccordion.tsx`** — apply EXACTLY these class replacements (content and behaviour untouched):

| Old | New |
|---|---|
| `bg-white rounded-2xl border border-brand-border shadow-card` | `bg-surface-1 rounded-[16px] border border-stroke shadow-ds` |
| `hover:bg-brand-bg` | `hover:bg-surface-2` |
| `font-semibold text-text-dark pr-4` | `font-semibold text-ink pr-4` |
| `shrink-0 text-text-light` | `shrink-0 text-ink-faint` (and add `open === i ? 'text-teal' : 'text-ink-faint'` via template: `className={\`shrink-0 ${open === i ? 'text-teal' : 'text-ink-faint'}\`}`) |
| `text-text-medium text-sm leading-relaxed border-t border-brand-border` | `text-ink-sub text-sm leading-relaxed border-t border-stroke` |

- [ ] **Step 3: Create `src/components/marketing/sections/Faq.tsx`**

```tsx
import FaqAccordion from '@/components/homepage/FaqAccordion';
import { FadeUp } from '../motion';

export default function Faq() {
  return (
    <section id="faq" className="py-24 px-4 bg-surface-page">
      <div className="max-w-3xl mx-auto">
        <FadeUp className="text-center mb-14">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-[-0.02em]">Frequently asked questions</h2>
        </FadeUp>
        <FaqAccordion />
      </div>
    </section>
  );
}
```

(Note: `Faq.tsx` uses `FadeUp` which is a client component — this file needs no `'use client'` since it only composes; Next handles the boundary in the imported components.)

- [ ] **Step 4: Create `src/components/marketing/sections/FinalCta.tsx`**

```tsx
import Link from 'next/link';
import { FadeUp } from '../motion';

export default function FinalCta() {
  return (
    <section className="relative py-24 px-4 bg-section-dark overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="max-w-3xl mx-auto text-center relative">
        <FadeUp>
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-[-0.025em] mb-5 leading-tight">
            Turn first-time visitors into <em className="font-serif italic font-medium text-[#F2C230]">loyal customers.</em>
          </h2>
          <p className="text-[#AEBDB5] text-lg mb-10">Join the LetLoyal India Pilot — free to get started.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/merchant/register" className="inline-flex items-center justify-center rounded-full bg-reward text-reward-fg font-bold text-lg px-10 py-4 hover:brightness-95 transition-[filter]">
              Get Started Free
            </Link>
            <Link href="/my-rewards" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white font-bold text-lg px-8 py-4 hover:bg-white/[0.14] transition-colors">
              View My Rewards
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Build + commit**

Run: `npm run build` → PASS.

```bash
git add src/components/marketing/sections/Testimonials.tsx src/components/marketing/sections/Faq.tsx src/components/marketing/sections/FinalCta.tsx src/components/homepage/FaqAccordion.tsx
git commit -m "mkt: testimonials, faq, final CTA; re-token FaqAccordion"
```

---

### Task 8: Compose the new homepage; delete HomeNav

**Files:**
- Modify: `src/app/page.tsx` (full replacement)
- Delete: `src/components/homepage/HomeNav.tsx`

- [ ] **Step 1: Replace `src/app/page.tsx` entirely with:**

```tsx
import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import Hero from '@/components/marketing/sections/Hero';
import SocialProof from '@/components/marketing/sections/SocialProof';
import Problem from '@/components/marketing/sections/Problem';
import HowItWorks from '@/components/marketing/sections/HowItWorks';
import Features from '@/components/marketing/sections/Features';
import CampaignTypes from '@/components/marketing/sections/CampaignTypes';
import LiveDemo from '@/components/marketing/sections/LiveDemo';
import Testimonials from '@/components/marketing/sections/Testimonials';
import Faq from '@/components/marketing/sections/Faq';
import FinalCta from '@/components/marketing/sections/FinalCta';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-page overflow-x-hidden">
      <MarketingNav tone="onDark" />
      <Hero />
      <SocialProof />
      <Problem />
      <HowItWorks />
      <Features />
      <CampaignTypes />
      <LiveDemo />
      <Testimonials />
      <Faq />
      <FinalCta />
      <MarketingFooter />
    </div>
  );
}
```

- [ ] **Step 2: Verify nothing else imports HomeNav, then delete it**

Run: `grep -rn "homepage/HomeNav" src --include='*.tsx'`
Expected: no matches (page.tsx no longer imports it). Then:

```bash
git rm src/components/homepage/HomeNav.tsx
```

- [ ] **Step 3: Build + quick dev check**

Run: `npm run build` → PASS. Then `npm run dev`: homepage renders — dark hero at top with nav glassy over it, all 10 sections present, footer dark.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "mkt: compose homepage from Teal & Honey sections; drop HomeNav"
```

---

### Task 9: LegalLayout + migrate 6 legal pages

**Files:**
- Create: `src/components/marketing/LegalLayout.tsx`
- Modify: `src/app/privacy-policy/page.tsx`, `src/app/terms-of-service/page.tsx`, `src/app/cookie-policy/page.tsx`, `src/app/merchant-terms/page.tsx`, `src/app/merchant-rights/page.tsx`, `src/app/customer-policy/page.tsx`

- [ ] **Step 1: Create `src/components/marketing/LegalLayout.tsx`**

```tsx
import MarketingNav from './MarketingNav';
import MarketingFooter from './MarketingFooter';

export default function LegalLayout({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-page">
      <MarketingNav tone="light" />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-display font-bold text-h1 text-ink mb-2">{title}</h1>
        {updated && <p className="text-ink-faint text-body-sm mb-10">{updated}</p>}
        <div className="space-y-8 text-ink-sub leading-relaxed [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-h3 [&_h2]:text-ink [&_h2]:mb-3 [&_a]:text-teal [&_a]:font-semibold">
          {children}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
```

- [ ] **Step 2: Migrate each of the 6 legal pages.** Same mechanical transformation for every page — shown here for `src/app/privacy-policy/page.tsx`; repeat identically for the other 5 (each has the same shape: header with Logo + `<main>` with an `h1`, a "Last updated" `p`, and a `div.space-y-8` of `<section>`s):

Old shape (per page):
```tsx
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
export const metadata = { ... };
export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="bg-white border-b border-brand-border px-4 py-4">…Logo…</header>
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 …>Privacy Policy</h1>
        <p …>Last updated: June 2026</p>
        <div className="space-y-8 …">
          {/* sections */}
        </div>
      </main>
    </div>
  );
}
```

New shape (keep `metadata` and ALL `<section>` content EXACTLY as-is; strip the per-section heading classes since LegalLayout styles them — change each `<h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">` to plain `<h2>`, and remove `text-text-*` classes inside sections where present, letting the wrapper's `text-ink-sub` apply; keep semantic tags):

```tsx
import LegalLayout from '@/components/marketing/LegalLayout';
export const metadata = { /* unchanged */ };
export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" updated="Last updated: June 2026">
      {/* the existing <section> blocks, content verbatim, h2s stripped of classes */}
    </LegalLayout>
  );
}
```

The `title` and `updated` strings come from each page's existing `h1` and "Last updated" line. Remove now-unused `Link`/`Logo` imports.

- [ ] **Step 3: Build + spot-check**

Run: `npm run build` → PASS. In dev, open `/privacy-policy` and `/merchant-terms`: light nav at top, styled prose, dark footer, all text present.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/LegalLayout.tsx src/app/privacy-policy/page.tsx src/app/terms-of-service/page.tsx src/app/cookie-policy/page.tsx src/app/merchant-terms/page.tsx src/app/merchant-rights/page.tsx src/app/customer-policy/page.tsx
git commit -m "mkt: shared LegalLayout; migrate 6 legal pages"
```

---

### Task 10: Dark-band contrast checks

**Files:**
- Modify: `scripts/check-contrast.mjs`

- [ ] **Step 1: Add a dark-band section to the checks array** in `scripts/check-contrast.mjs` (append to the existing `checks` array, before the loop):

```js
// Marketing dark bands (#0E1A17) — theme-independent
const band = '#0E1A17';
checks.push(
  ['band white on section-dark', '#FFFFFF', band, 4.5],
  ['band secondary #AEBDB5 on section-dark', '#AEBDB5', band, 4.5],
  ['band tertiary #7C8C84 on section-dark (large/labels)', '#7C8C84', band, 3.0],
  ['band mint kicker #9FE7CC on section-dark', '#9FE7CC', band, 4.5],
  ['band honey serif #F2C230 on section-dark (large text)', '#F2C230', band, 3.0],
);
```

(If `checks` is declared `const` as an array literal, `checks.push(...)` after the declaration is valid — place this block immediately after the array declaration.)

- [ ] **Step 2: Run**

Run: `npm run check:contrast`
Expected: all PASS. If `#7C8C84` on the band fails 3:1, lighten to `#8A9A91` in BOTH the script and every component using `text-[#7C8C84]` (Hero, MarketingFooter), then re-run.

- [ ] **Step 3: Commit**

```bash
git add scripts/check-contrast.mjs
git commit -m "mkt: contrast checks for marketing dark bands"
```

---

### Task 11: Final verification + deploy gate

**Files:** none (verification only)

- [ ] **Step 1: Build + lint**

Run: `npm run build && npm run lint`
Expected: build PASS; lint has no NEW warnings (pre-existing `LocationPicker.tsx` warning is known).

- [ ] **Step 2: Browser sweep** (dev server via the Browser pane, `letloyal-dev` launch config)

At desktop (1280), tablet (768), mobile (375):
- `/` — dark hero renders, nav is glassy at top and switches to light after scrolling ~30px, mobile hamburger opens/closes, headline serif flourish visible.
- Anchors: nav "How It Works" scrolls to the section; "FAQ" scrolls to FAQ; footer `/#how-it-works` works from `/privacy-policy`.
- CTAs resolve: `/merchant/register`, `/merchant/login`, `/my-rewards` (click each once).
- FAQ accordion opens/closes; chevron turns teal when open.
- Legal pages: `/privacy-policy`, `/terms-of-service`, `/cookie-policy`, `/merchant-terms`, `/merchant-rights`, `/customer-policy` all render with nav + footer.
- No horizontal scroll at 375px; no console errors (ignore SW-stale hydration warnings on first load only).

- [ ] **Step 3: Deploy gate (STOP — requires user confirmation)**

Run: `git remote -v` → must show `Jaison650/letloyal-production`.
ASK THE USER: "Marketing redesign complete and verified locally (N commits). Push to GitHub and deploy?" Only after explicit yes: `git push origin master`, then run `./deploy.sh` on the VPS via SSH and confirm PM2 online + live site serves the new homepage.

---

## Self-review notes

- **Spec coverage:** all 10 homepage sections + nav/footer (Tasks 1–8), legal pages incl. customer-policy (Task 9), contrast additions (Task 10), verification + gated deploy (Task 11). Copy rules honoured: testimonials/FAQ verbatim, truthful proof line, CTA destinations unchanged, anchors preserved.
- **Intentional fixes:** footer/nav anchor links become `/#how-it-works` form so they work from legal pages.
- **Type consistency:** `fadeUp`/`staggerContainer`/`FadeUp` exported from `../motion` and imported consistently; `MarketingNav` `tone` prop used in Tasks 8–9; ds imports limited to `Card`, `Badge`.
- **Known simplifications:** glass/honey pill CTAs on dark bands are inline classes rather than ds Button variants (glass isn't a ds intent; YAGNI until a second surface needs it). `animate-float`, `animate-marquee`, `animate-pulse-glow`, `bg-gradient-brand` remain from the existing Tailwind config — they are already defined and unchanged.
