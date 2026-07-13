# Merchant Workflows + Theme Toggle ("Teal & Honey" Phase 2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-token all remaining merchant portal pages/components and mount the theme toggle, making the portal the first fully dark-capable surface.

**Architecture:** Recipe-driven restyle-in-place using the canonical mapping table below (proven in Phases 1–2a), ordered risk-ascending. New code only for the ThemeProvider layout wrap and the ThemeToggle mount. Behaviour preservation enforced by mechanical diff scans per file.

**Tech Stack:** Next.js 15, Tailwind tokens (Phase 0), `@/components/ds`, existing hand-rolled SVG charts.

**Spec:** `docs/superpowers/specs/2026-07-13-merchant-workflows-theme-design.md`

**Conventions for every task:**
- Repo root `letloyal-production`, branch `master`; commit prefix `mrp:`; `npx tsc --noEmit` AND `npm run build` pass before each commit (run separately, long timeouts).
- **PRIME RULE — behaviour preservation:** no changes to fetch calls, handlers, state, redirects, queries, QR/canvas/download/print logic, OTP validation, upload flows, field names, or copy. After each file: `git diff <file> | grep "^[-+]" | grep -E "fetch\(|router\.|useState|useEffect|canvas|toDataURL|toBlob|navigator\.|window\.print|URL\.createObjectURL"` must return ONLY unchanged-pair or empty results; investigate any hit before committing.
- **Dark-readiness rule:** never leave raw `bg-white`, `text-black`, `bg-gray-*`, `text-slate-*`, hex colours, or Tailwind palette colours (red/emerald/amber/etc.) in re-tokened files — every colour must be a token class (or, for reward/dark-band accents, one of the sanctioned fixed values below). This is what makes dark mode work.
- Do NOT push before the final task's user gate. Do NOT modify `src/components/ds/*` (read-only), `Logo.tsx`, or marketing/auth files.

## Canonical mapping table (use everywhere)

| Legacy | Replacement |
|---|---|
| `className="card…"` | ds `<Card padding="md">` when a plain wrapper div; otherwise `rounded-[16px] border border-stroke bg-surface-1 shadow-ds p-5` |
| `btn-primary` | ds `<Button>` (teal) on `<button>`; on `<Link>`: `inline-flex items-center justify-center rounded-full bg-teal text-teal-fg font-bold hover:bg-teal-hover transition-colors` + size padding |
| `btn-secondary` | `<Button intent="secondary">` / `rounded-full border border-stroke-strong bg-surface-1 text-ink font-bold hover:bg-surface-2` |
| `btn-ghost` | `<Button intent="ghost">` / `rounded-full text-teal font-bold hover:bg-teal-subtle` |
| `form-input` / ad-hoc inputs | ds `<Input>` where props fit; else `w-full rounded-[11px] border-[1.5px] border-stroke-strong bg-surface-1 text-ink placeholder:text-ink-faint focus:outline-none focus:border-teal focus:shadow-ring` |
| labels `text-sm font-medium text-text-dark` | `text-body-sm font-semibold text-ink` |
| `text-text-dark` / `-medium` / `-light` | `text-ink` / `text-ink-sub` / `text-ink-faint` |
| `border-border-light` | `border-stroke` |
| `bg-bg-muted` | `bg-surface-2` (wells/hover) or `bg-surface-page` (page background) |
| `bg-surface` | `bg-surface-1` |
| `bg-white` | `bg-surface-1` |
| `bg-primary-light` | `bg-teal-subtle` |
| `bg-primary` + `text-white` | `bg-teal` + `text-teal-fg` |
| `text-primary` / `ring-primary` / `border-primary` | `text-teal` / `shadow-ring` on focus / `border-teal` |
| error: `bg-red-50 border-red-200 text-red-*|text-status-error` | `bg-bad-subtle text-bad` (drop the border, `rounded-[11px]`) |
| success: `bg-emerald-50|green-50 … text-emerald-*|green-*` | `bg-good-subtle text-good` |
| reward-meaning amber/yellow (unlocked rewards, redemption) | `bg-reward-subtle text-reward-deep border-reward/40`, badges `<Badge intent="reward">` |
| caution-meaning amber (warnings, pending states) | `bg-warn-subtle text-warn` |
| `shadow-card` / `shadow-card-hover` | `shadow-ds` |
| card `rounded-2xl` | `rounded-[16px]` |
| hex `#0d9488` (charts/inline styles) | `var(--accent-default)` |
| hex `#94a3b8` | `var(--text-tertiary)` |
| chart redemption series (any colour) | `#F2B824` (sanctioned fixed honey) |
| chart gridlines/axis text | `var(--border-default)` / `var(--text-tertiary)` |

Sanctioned fixed values (only these may remain hardcoded): merchant-brand colours from data, `#F2B824` chart honey, dark-band palette inside `bg-section-dark` panels (`#9FE7CC`, `#AEBDB5`, `#7C8C84`, `#F2C230`).

---

### Task 1: Thin wrapper pages

**Files (read each fully first, then apply the table):**
- Modify: `src/app/m/[slug]/settings/page.tsx`, `src/app/m/[slug]/campaign/page.tsx`, `src/app/m/[slug]/feedback/page.tsx`, `src/app/m/[slug]/redeem/page.tsx`, `src/app/m/[slug]/customers/page.tsx`, `src/app/m/[slug]/analytics/page.tsx`, `src/app/m/[slug]/qr/page.tsx`

- [ ] **Step 1:** For each file: read fully → apply the mapping table to every class/hex → run the behaviour diff scan. Files with zero legacy hits (`customers`, `analytics`) may need nothing — verify and skip if already clean; note that in the report.
- [ ] **Step 2:** `npx tsc --noEmit` → PASS; `npm run build` → PASS.
- [ ] **Step 3:** Commit:
```bash
git add "src/app/m/[slug]/settings/page.tsx" "src/app/m/[slug]/campaign/page.tsx" "src/app/m/[slug]/feedback/page.tsx" "src/app/m/[slug]/redeem/page.tsx" "src/app/m/[slug]/customers/page.tsx" "src/app/m/[slug]/analytics/page.tsx" "src/app/m/[slug]/qr/page.tsx"
git commit -m "mrp: re-token thin portal wrapper pages"
```

### Task 2: offers, validate, push pages

**Files:**
- Modify: `src/app/m/[slug]/offers/page.tsx`, `src/app/m/[slug]/validate/page.tsx`, `src/app/m/[slug]/push/page.tsx`

- [ ] **Step 1:** Same procedure as Task 1 per file. `push/page.tsx` (337 lines, 32 hits) is the largest — its push-subscription logic (`navigator.serviceWorker`, `PushManager`, VAPID handling) is strictly off-limits; only classes change.
- [ ] **Step 2:** tsc + build → PASS. Behaviour scan per file.
- [ ] **Step 3:** Commit: `git commit -m "mrp: re-token offers, validate, push pages"` (with the three files staged).

### Task 3: FeedbackList, CampaignForm, ProfileEditor

**Files:**
- Modify: `src/components/merchant/FeedbackList.tsx`, `src/components/merchant/CampaignForm.tsx`, `src/components/merchant/ProfileEditor.tsx`

- [ ] **Step 1:** Apply the table. Form specifics: text/number/textarea inputs → ds `Input`/`Textarea` where the element takes only native props + className; keep native `<select>` elements native but re-token their classes (field classes from the table) — do NOT convert to ds Select (Radix select changes keyboard/mobile behaviour; YAGNI). Upload zones/file inputs in ProfileEditor: re-token borders/text only; upload handlers untouched.
- [ ] **Step 2:** tsc + build → PASS. Behaviour scan per file (ProfileEditor especially: no changed lines matching `FormData|upload|fetch\(|onChange`).
- [ ] **Step 3:** Commit: `git commit -m "mrp: re-token feedback list, campaign form, profile editor"`.

### Task 4: RedemptionValidator (business-critical)

**Files:**
- Modify: `src/components/merchant/RedemptionValidator.tsx`

- [ ] **Step 1:** Apply the table. The OTP input gets the exact verify-email treatment:
```
w-full border-[1.5px] border-stroke-strong bg-surface-1 text-ink rounded-[11px] px-4 py-3 text-lg tracking-widest text-center font-bold placeholder:text-ink-faint focus:outline-none focus:border-teal focus:shadow-ring
```
Success state → `bg-good-subtle text-good`; invalid/expired → `bg-bad-subtle text-bad`; the unlocked-reward presentation (reward name/description block) → `bg-reward-subtle text-reward-deep border border-reward/40`.
- [ ] **Step 2:** tsc + build → PASS. Strict behaviour scan: zero changed lines matching `fetch\(|otp|OTP|validate|setInterval|setTimeout|useState` beyond pure className edits — paste the scan output in the report.
- [ ] **Step 3:** Commit: `git commit -m "mrp: re-token redemption validator (OTP flow untouched)"`.

### Task 5: QRPanel

**Files:**
- Modify: `src/components/merchant/QRPanel.tsx`

- [ ] **Step 1:** Apply the table to the surrounding UI: mode tabs, size/colour controls, preview frame, download/print buttons, helper text. STRICTLY untouched: QR rendering (`qrcode` lib calls, canvas/SVG generation), colour-picker OUTPUT values (merchants pick arbitrary QR colours — those are data, not UI), download/print handlers, filename logic. If a control's visual style is derived from the merchant-chosen QR colour, leave that derivation as-is.
- [ ] **Step 2:** tsc + build → PASS. Behaviour scan: zero changed lines matching `toDataURL|toBlob|createObjectURL|window\.print|QRCode|qrcode|download`.
- [ ] **Step 3:** Commit: `git commit -m "mrp: re-token QR studio UI (generation/download untouched)"`.

### Task 6: InsightsClient (charts)

**Files:**
- Modify: `src/components/merchant/InsightsClient.tsx`

- [ ] **Step 1:** Apply the table (96 legacy hits — mostly text/card/border classes). Chart-specific rules:
  - Primary data series (visits/scans): `var(--accent-default)` (replaces the 4× `#0d9488`).
  - Redemption/reward series or bars: `#F2B824`.
  - Secondary/comparison series: `var(--text-tertiary)` (replaces `#94a3b8`).
  - Gridlines: `var(--border-default)`; axis labels: `var(--text-tertiary)` or `text-ink-faint`.
  - Stat tiles → the 2a KPI pattern: `Card padding="sm"` + teal icon squircle + `font-display font-bold [font-variant-numeric:tabular-nums] text-ink` values + `text-label uppercase text-ink-faint` labels.
- [ ] **Step 2:** tsc + build → PASS. Behaviour scan: zero changed lines matching `fetch\(|useMemo|reduce\(|map\(.*=>.*\{` that alter computation (className-only edits inside map callbacks are fine — verify by eye).
- [ ] **Step 3:** Commit: `git commit -m "mrp: re-token insights charts (teal series, honey redemptions)"`.

### Task 7: Mount ThemeProvider + ThemeToggle

**Files:**
- Modify: `src/app/m/[slug]/layout.tsx`, `src/components/merchant/DashboardShell.tsx`

- [ ] **Step 1:** In `src/app/m/[slug]/layout.tsx`, add the import and wrap the return (everything else identical):

```tsx
import { ThemeProvider } from '@/components/ds';
```
```tsx
  return (
    <ThemeProvider>
      <DashboardShell slug={slug} businessName={merchant.business_name} logoUrl={merchant.logo_url}>
        {children}
      </DashboardShell>
    </ThemeProvider>
  );
```

- [ ] **Step 2:** In `DashboardShell.tsx`, add `import { ThemeToggle } from '@/components/ds';` and change the sidebar footer's logout block (inside `SidebarContent`) to a row:

```tsx
      <div className="px-3 py-4 border-t border-stroke space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 flex-1 px-4 py-2.5 rounded-full text-body-sm font-semibold text-ink-sub hover:bg-bad-subtle hover:text-bad transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
          <ThemeToggle />
        </div>
        <div className="flex justify-center">
          <PoweredBy />
        </div>
      </div>
```

(`SidebarContent` renders in both the desktop sidebar and the mobile drawer, so one edit covers both.)

- [ ] **Step 3:** tsc + build → PASS. In local dev (UI-only check, no DB needed): unauthenticated portal redirects, so verify the toggle via `/design-system` still works, and confirm `document.documentElement` gets `data-theme` when toggled there.
- [ ] **Step 4:** Commit: `git commit -m "mrp: mount theme toggle in portal shell"` (both files staged).

### Task 8: Verification + deploy gate

- [ ] **Step 1:** `npm run build`, `npm run lint` (only pre-existing LocationPicker warning), `npm run check:contrast` (all pass).
- [ ] **Step 2:** Dark-readiness grep over all re-tokened files — must return nothing:
```bash
grep -nE "bg-white|text-black|bg-gray-|text-slate-|bg-red-|bg-emerald-|bg-amber-|bg-green-|text-red-|text-emerald-|text-amber-" src/components/merchant/QRPanel.tsx src/components/merchant/InsightsClient.tsx src/components/merchant/ProfileEditor.tsx src/components/merchant/CampaignForm.tsx src/components/merchant/RedemptionValidator.tsx src/components/merchant/FeedbackList.tsx "src/app/m/[slug]/offers/page.tsx" "src/app/m/[slug]/validate/page.tsx" "src/app/m/[slug]/push/page.tsx"
```
- [ ] **Step 3: Deploy gate (STOP — user confirmation).** `git remote -v` = `Jaison650/letloyal-production`. After explicit yes: push, VPS `./deploy.sh`, PM2 online.
- [ ] **Step 4: Live sweep** (demo merchant `demo.restaurant@letloyal.in` / `Demo@1234`, slug `spice-junction`): all 11 portal pages in light AND dark (toggle in sidebar; persists across reload); QR page renders and download link present; validate page rejects a wrong OTP with the new error styling; marketing homepage + login page eyeballed in dark (`localStorage.setItem('theme','dark')`) since tokens are global. Error log unchanged. Rollback = revert 2b commits + redeploy.

---

## Self-review notes

- **Spec coverage:** re-token order §1–5 → Tasks 1–6; toggle §Theme → Task 7; verification incl. global-token dark note → Task 8. Honey-semantics rule encoded in the table (reward vs warn split). Native selects stay native (spec §2).
- **Recipe justification:** the mapping table is the same one executed successfully across Phases 1–2a (legal pages, auth pages, shell, dashboard); executors read files first and the behaviour scans are mechanical.
- **Type consistency:** ds imports limited to `Card`, `Badge`, `Button`, `Input`, `Textarea`, `ThemeProvider`, `ThemeToggle` — all exist in the Phase-0 barrel.
- **Known risk:** QRPanel merchant-chosen colours are data, explicitly exempted; chart honey `#F2B824` is a sanctioned fixed value because SVG attrs can't always take CSS vars with opacity variants — plain `var(--accent-default)` is used where it can.
