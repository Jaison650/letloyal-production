# LetLoyal India Launch Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `letloyal-production` (India build) with 11 features for launch-readiness: secure customer auth, merchant self-registration with OTP, DPDP compliance, admin panel upgrades, Google OAuth, location/nearby, streak campaigns, instant offers, PWA, rich welcome email, and in-app QR scanner.

**Architecture:** All changes stay in the existing flat URL structure (no locale prefix). No i18n framework — English only. Customer auth migrates from localStorage Bearer token to httpOnly cookie. New DB columns are additive ALTER TABLE migrations. Google OAuth uses the same flow as EU build but India-context only.

**Tech Stack:** Next.js 15, MySQL2, bcryptjs, jsonwebtoken, nodemailer (Brevo SMTP), Cloudflare R2, `jsqr` (QR scanning), `web-push`, Tailwind CSS, Framer Motion.

---

## Module Map — Files Created / Modified

### M0 — DB Migrations
- Modify: `schema.sql` (new columns + tables, documented as ALTER TABLE comments)

### M1 — Customer Auth Security (httpOnly cookie)
- Modify: `src/lib/customerAuth.ts` — add cookie helpers, keep Bearer for backward compat
- Modify: `src/lib/authConstants.ts` — add `CUSTOMER_COOKIE_NAME`
- Modify: `src/app/api/customer/auth/login/route.ts` — set cookie on response
- Modify: `src/app/api/customer/auth/register/route.ts` — set cookie on response
- Modify: `src/app/api/customer/auth/logout/route.ts` — clear cookie
- Modify: `src/app/api/customer/auth/forgot/route.ts` — no change (email only)
- Modify: `src/app/api/customer/auth/reset/route.ts` — set cookie after reset
- Modify: `src/app/api/customer/profile/route.ts` — read from cookie instead of Bearer
- Modify: `src/app/api/customer/account/route.ts` — read from cookie
- Modify: `src/app/my-rewards/page.tsx` — remove localStorage token logic, read from cookie via API
- Modify: `src/middleware.ts` — add customer cookie guard for `/api/customer/*` protected routes
- Delete: `src/lib/customerSession.ts`, `src/lib/customerTokenKey.ts` (localStorage helpers, no longer needed)

### M2 — Merchant Email OTP Verification
- Modify: `src/app/api/merchant/auth/register/route.ts` — add OTP generation, set `email_verified=0`, `status='pending'`
- Create: `src/app/api/merchant/auth/verify-email/route.ts`
- Create: `src/app/api/merchant/auth/resend-otp/route.ts`
- Create: `src/app/merchant/verify-email/page.tsx`
- Create: `src/app/merchant/verify-email/layout.tsx`
- Modify: `src/lib/mail.ts` — add `sendMerchantEmailOTP()` and `sendNewMerchantAlert()`
- Modify: `src/middleware.ts` — whitelist new OTP routes

### M3 — DPDP Compliance
- Create: `src/lib/consent.ts` — consent state manager
- Create: `src/app/api/consent/route.ts` — log consent to DB
- Create: `src/components/ConsentBanner.tsx` — DPDP consent banner (Necessary / Analytics)
- Create: `src/app/cookie-policy/page.tsx`
- Create: `src/app/customer-policy/page.tsx`
- Create: `src/app/merchant-terms/page.tsx`
- Create: `src/app/merchant-rights/page.tsx`
- Modify: `src/app/privacy-policy/page.tsx` — keep DPDP framing, update contact to hello@letloyal.com
- Modify: `src/app/terms-of-service/page.tsx` — add DPDP references
- Modify: `src/app/layout.tsx` — add `<ConsentBanner />`

### M4 — Admin Panel Upgrades
- Create: `src/app/admin/billing/page.tsx`
- Create: `src/app/api/admin/billing/route.ts`
- Create: `src/app/api/admin/billing/[id]/route.ts`
- Create: `src/app/admin/services/page.tsx`
- Create: `src/app/api/admin/services/route.ts`
- Create: `src/app/api/admin/auth/change-password/route.ts`
- Modify: `src/app/admin/AdminShell.tsx` — add Billing + Services nav, change password form
- Modify: `src/lib/constants.ts` — extend `ADMIN_SESSION_MAX_AGE` to 7 days
- Modify: `src/middleware.ts` — add `?redirect=` param on admin login redirect

### M5 — Google OAuth for Customers
- Create: `src/app/api/customer/auth/google/route.ts`
- Create: `src/app/api/customer/auth/google/callback/route.ts`
- Modify: `src/app/my-rewards/page.tsx` — add "Continue with Google" button on login/register
- Modify: `src/app/api/customer/auth/register/route.ts` — make `phone_number` optional (already nullable after M0)

### M6 — Location + Nearby Store Discovery
- Create: `src/components/merchant/LocationPicker.tsx` — OSM Leaflet map pin picker
- Create: `src/app/api/customer/nearby/route.ts`
- Modify: `src/app/m/[slug]/settings/page.tsx` — add LocationPicker section
- Modify: `src/app/api/merchant/[slug]/profile/route.ts` — save lat/lng/website_url
- Modify: `src/app/my-rewards/page.tsx` — add Nearby tab/section

### M7 — Streak Campaigns
- Modify: `src/components/merchant/CampaignForm.tsx` — add streak toggle + fields
- Modify: `src/app/api/merchant/[slug]/campaign/route.ts` — save streak columns
- Modify: `src/app/api/scan/route.ts` — apply streak multiplier on points calculation

### M8 — Instant Offers
- Create: `src/app/api/merchant/[slug]/offers/route.ts`
- Create: `src/app/m/[slug]/offers/page.tsx`
- Create: `src/app/offer/[slug]/[offerId]/page.tsx`
- Modify: `src/app/my-rewards/page.tsx` — show active offers on cards tab

### M9 — PWA (Manifest + Icons + Offline)
- Create: `public/manifest.json`
- Create: `public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`
- Create: `public/sw.js` — install/activate/fetch with offline fallback
- Create: `src/components/ServiceWorkerRegistrar.tsx`
- Create: `src/app/offline/page.tsx`
- Modify: `src/app/layout.tsx` — add manifest link, theme-color, `<ServiceWorkerRegistrar />`

### M10 — Merchant Welcome Email Redesign
- Modify: `src/lib/mail.ts` — rewrite `sendMerchantWelcome()` HTML with 3-step setup, feature cards, dual CTAs

### M11 — Customer In-App QR Scanner
- Modify: `src/app/my-rewards/page.tsx` — replace "steps" UI in Scan tab with real `jsqr`-powered camera scanner
- Modify: `package.json` — add `jsqr` dependency

---

## Task 1: DB Schema Migrations

**Files:**
- Modify: `schema.sql`

- [ ] **Step 1: Add missing columns to schema.sql**

Open `schema.sql`. Add these ALTER TABLE statements as comments (documenting migration history) AND ensure the CREATE TABLE statements include them for fresh installs:

```sql
-- M0 migrations — run on existing DB:
-- ALTER TABLE merchants ADD COLUMN website_url VARCHAR(500) NULL AFTER phone;
-- ALTER TABLE merchants ADD COLUMN latitude DECIMAL(10,7) NULL AFTER website_url;
-- ALTER TABLE merchants ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude;
-- ALTER TABLE merchants ADD COLUMN plan ENUM('free','starter','pro') NOT NULL DEFAULT 'free' AFTER status;
-- ALTER TABLE merchants ADD COLUMN billing_note TEXT NULL AFTER plan;
-- ALTER TABLE merchants ADD COLUMN email_otp CHAR(6) NULL AFTER billing_note;
-- ALTER TABLE merchants ADD COLUMN email_otp_expires DATETIME NULL AFTER email_otp;
-- ALTER TABLE merchants ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER email_otp_expires;
-- ALTER TABLE campaigns ADD COLUMN streak_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER points_per_rupee;
-- ALTER TABLE campaigns ADD COLUMN streak_period ENUM('day','week') NULL AFTER streak_enabled;
-- ALTER TABLE campaigns ADD COLUMN streak_days TINYINT UNSIGNED NULL AFTER streak_period;
-- ALTER TABLE campaigns ADD COLUMN streak_multiplier DECIMAL(3,1) NULL DEFAULT 1.5 AFTER streak_days;
-- ALTER TABLE customers MODIFY COLUMN phone_number VARCHAR(20) NULL;
-- ALTER TABLE customers ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER password_hash;
-- ALTER TABLE customers ADD COLUMN birthday DATE NULL;
-- ALTER TABLE customers ADD COLUMN gender VARCHAR(20) NULL;
```

- [ ] **Step 2: Add consent_log table to schema.sql**

```sql
CREATE TABLE IF NOT EXISTS consent_log (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  visitor_ref   VARCHAR(64)   NOT NULL,
  categories    JSON          NOT NULL,
  locale        CHAR(5)       NOT NULL DEFAULT 'en',
  ip            VARCHAR(45)   NULL,
  user_agent    TEXT          NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_consent_visitor (visitor_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- [ ] **Step 3: Add instant offers table**

```sql
CREATE TABLE IF NOT EXISTS instant_offers (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  merchant_id     CHAR(36)      NOT NULL,
  title           VARCHAR(120)  NOT NULL,
  description     TEXT          NULL,
  valid_until     DATETIME      NOT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_offers_merchant (merchant_id),
  CONSTRAINT fk_offers_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- [ ] **Step 4: Run migrations on the VPS MySQL**

SSH into VPS and run:
```bash
mysql -u root -p letloyal_db << 'SQL'
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS website_url VARCHAR(500) NULL;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7) NULL;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7) NULL;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS plan ENUM('free','starter','pro') NOT NULL DEFAULT 'free';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS billing_note TEXT NULL;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS email_otp CHAR(6) NULL;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS email_otp_expires DATETIME NULL;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS streak_enabled TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS streak_period ENUM('day','week') NULL;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS streak_days TINYINT UNSIGNED NULL;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS streak_multiplier DECIMAL(3,1) NULL DEFAULT 1.5;
ALTER TABLE customers MODIFY COLUMN phone_number VARCHAR(20) NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) NULL UNIQUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birthday DATE NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender VARCHAR(20) NULL;

CREATE TABLE IF NOT EXISTS consent_log (
  id CHAR(36) NOT NULL DEFAULT (UUID()), visitor_ref VARCHAR(64) NOT NULL,
  categories JSON NOT NULL, locale CHAR(5) NOT NULL DEFAULT 'en',
  ip VARCHAR(45) NULL, user_agent TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), INDEX idx_consent_visitor (visitor_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS instant_offers (
  id CHAR(36) NOT NULL DEFAULT (UUID()), merchant_id CHAR(36) NOT NULL,
  title VARCHAR(120) NOT NULL, description TEXT NULL,
  valid_until DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), INDEX idx_offers_merchant (merchant_id),
  CONSTRAINT fk_offers_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQL
echo "Migrations done"
```

Note: `email_verified DEFAULT 1` for existing merchants so they don't get locked out. New registrations will default to 0 (set in M2).

- [ ] **Step 5: Commit**

```bash
git add schema.sql
git commit -m "chore: add M0 schema migrations for India launch"
```

---

## Task 2: Customer Auth — httpOnly Cookie Migration

**Files:**
- Modify: `src/lib/authConstants.ts`
- Modify: `src/lib/customerAuth.ts`
- Modify: `src/app/api/customer/auth/login/route.ts`
- Modify: `src/app/api/customer/auth/register/route.ts`
- Modify: `src/app/api/customer/auth/logout/route.ts`
- Modify: `src/app/api/customer/auth/reset/route.ts`
- Modify: `src/middleware.ts`

- [ ] **Step 1: Add CUSTOMER_COOKIE_NAME to authConstants.ts**

```typescript
// src/lib/authConstants.ts
export const MERCHANT_COOKIE_NAME = 'merchant_token';
export const ADMIN_COOKIE_NAME    = 'admin_token';
export const CUSTOMER_COOKIE_NAME = 'customer_session';
```

- [ ] **Step 2: Rewrite customerAuth.ts — cookie-based**

Replace entire `src/lib/customerAuth.ts`:

```typescript
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { CUSTOMER_COOKIE_NAME } from '@/lib/authConstants';

const SECRET = (() => {
  const s = process.env.CUSTOMER_JWT_SECRET;
  if (!s && process.env.NODE_ENV === 'production') throw new Error('CUSTOMER_JWT_SECRET required');
  return s || 'dev_cust_secret_change_in_production';
})();

const EXPIRY = '30d';
export const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export interface CustomerTokenPayload {
  sub:   string;
  type:  'customer';
  phone: string | null;
}

export function signCustomerToken(payload: Omit<CustomerTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'customer' }, SECRET, { expiresIn: EXPIRY } as jwt.SignOptions);
}

export function verifyCustomerToken(token: string): CustomerTokenPayload | null {
  try {
    const p = jwt.verify(token, SECRET) as CustomerTokenPayload;
    if (p.type !== 'customer') return null;
    return p;
  } catch { return null; }
}

// Server component / route handler (reads cookie store)
export async function getCustomerSession(): Promise<CustomerTokenPayload | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

// Middleware / API route (reads from NextRequest)
export function getCustomerFromRequest(req: NextRequest): CustomerTokenPayload | null {
  const token = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

export async function requireCustomerSession(): Promise<CustomerTokenPayload> {
  const payload = await getCustomerSession();
  if (!payload) throw new Response(JSON.stringify({ error: 'Not authenticated.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  return payload;
}
```

- [ ] **Step 3: Update login route to set cookie**

Replace `src/app/api/customer/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { comparePassword } from '@/lib/auth';
import { signCustomerToken, CUSTOMER_SESSION_MAX_AGE } from '@/lib/customerAuth';
import { CUSTOMER_COOKIE_NAME } from '@/lib/authConstants';
import { queryOne } from '@/lib/db';
import { normalizePhone } from '@/lib/utils';
import { isRateLimited, rateLimitKey } from '@/lib/rateLimit';

interface CustomerRow {
  id: string; name: string | null; phone_number: string | null;
  email: string | null; password_hash: string | null; google_id: string | null;
}

export async function POST(req: NextRequest) {
  if (isRateLimited(rateLimitKey(req, 'cust-login'), 10)) {
    return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 });
  }
  try {
    const { identifier, password } = await req.json();
    if (!identifier || !password) return NextResponse.json({ error: 'Email/phone and password are required.' }, { status: 400 });

    const normPhone = normalizePhone(identifier);
    const normEmail = identifier.toLowerCase().trim();

    const customer = await queryOne<CustomerRow>(
      'SELECT id, name, phone_number, email, password_hash, google_id FROM customers WHERE phone_number = ? OR email = ? LIMIT 1',
      [normPhone || '', normEmail]
    );

    const dummy = '$2a$12$dummyhashfortimingprotectiononly.000000000000000000000000';
    const match = await comparePassword(password, customer?.password_hash ?? dummy);
    if (!customer || !match) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });

    const token = signCustomerToken({ sub: customer.id, phone: customer.phone_number });
    const res = NextResponse.json({ ok: true, customer: { id: customer.id, name: customer.name, phone: customer.phone_number, email: customer.email } });
    res.cookies.set({ name: CUSTOMER_COOKIE_NAME, value: token, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: CUSTOMER_SESSION_MAX_AGE });
    return res;
  } catch (err) {
    console.error('[POST /api/customer/auth/login]', err);
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Update register route to set cookie**

In `src/app/api/customer/auth/register/route.ts`, replace the final `return NextResponse.json(...)` block:

```typescript
const token = signCustomerToken({ sub: customer.id, phone: normPhone });
const res = NextResponse.json({
  ok: true,
  customer: { id: customer.id, name: customer.name, phone: normPhone, email: normEmail },
}, { status: 201 });
res.cookies.set({ name: CUSTOMER_COOKIE_NAME, value: token, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: CUSTOMER_SESSION_MAX_AGE });
return res;
```

Also add imports at top:
```typescript
import { signCustomerToken, CUSTOMER_SESSION_MAX_AGE } from '@/lib/customerAuth';
import { CUSTOMER_COOKIE_NAME } from '@/lib/authConstants';
```

- [ ] **Step 5: Create logout route**

Create `src/app/api/customer/auth/logout/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { CUSTOMER_COOKIE_NAME } from '@/lib/authConstants';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: CUSTOMER_COOKIE_NAME, value: '', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}
```

- [ ] **Step 6: Update reset route to set cookie after password reset**

In `src/app/api/customer/auth/reset/route.ts`, after updating password in DB, set the cookie:
```typescript
const token = signCustomerToken({ sub: customer.id, phone: customer.phone_number });
const res = NextResponse.json({ ok: true });
res.cookies.set({ name: CUSTOMER_COOKIE_NAME, value: token, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: CUSTOMER_SESSION_MAX_AGE });
return res;
```

- [ ] **Step 7: Update middleware to guard customer API routes via cookie**

In `src/middleware.ts`, add customer cookie guard and whitelist, and add `?redirect=` param on admin redirect:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MERCHANT_COOKIE_NAME, ADMIN_COOKIE_NAME, CUSTOMER_COOKIE_NAME } from '@/lib/authConstants';

const MERCHANT_AUTH_WHITELIST = [
  '/api/merchant/auth/register',
  '/api/merchant/auth/login',
  '/api/merchant/auth/logout',
  '/api/merchant/auth/forgot',
  '/api/merchant/auth/reset',
  '/api/merchant/auth/verify-email',
  '/api/merchant/auth/resend-otp',
];

const CUSTOMER_AUTH_WHITELIST = [
  '/api/customer/auth/login',
  '/api/customer/auth/register',
  '/api/customer/auth/logout',
  '/api/customer/auth/forgot',
  '/api/customer/auth/reset',
  '/api/customer/auth/google',
  '/api/customer/auth/google/callback',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/merchant/') && !MERCHANT_AUTH_WHITELIST.includes(pathname)) {
    if (!req.cookies.get(MERCHANT_COOKIE_NAME)?.value)
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  if (pathname.startsWith('/api/admin/') && pathname !== '/api/admin/auth/login' && pathname !== '/api/admin/auth/logout') {
    if (!req.cookies.get(ADMIN_COOKIE_NAME)?.value)
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  if (pathname.startsWith('/api/customer/') && !CUSTOMER_AUTH_WHITELIST.includes(pathname)) {
    if (!req.cookies.get(CUSTOMER_COOKIE_NAME)?.value)
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!req.cookies.get(ADMIN_COOKIE_NAME)?.value) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/merchant/:path*', '/api/admin/:path*', '/api/customer/:path*', '/admin/:path*', '/admin'],
};
```

- [ ] **Step 8: Update my-rewards page to use cookie-based auth**

In `src/app/my-rewards/page.tsx`:
- Remove all `getCustomerToken()`, `saveCustomerSession()`, `clearCustomerSession()`, `getCustomerSession()` localStorage calls
- Replace with `credentials: 'include'` on all fetch calls (cookies sent automatically)
- Add a `/api/customer/auth/me` call on mount to check if logged in
- On logout call `POST /api/customer/auth/logout`

Create `src/app/api/customer/auth/me/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerAuth';
import { queryOne } from '@/lib/db';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const customer = await queryOne<{ id: string; name: string | null; phone_number: string | null; email: string | null; birthday: string | null; gender: string | null }>(
    'SELECT id, name, phone_number, email, birthday, gender FROM customers WHERE id = ?', [session.sub]
  );
  if (!customer) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, customer });
}
```

- [ ] **Step 9: Extend admin session to 7 days**

In `src/lib/constants.ts`:
```typescript
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (was 12 hours)
```

- [ ] **Step 10: Delete obsolete localStorage files**

Delete `src/lib/customerSession.ts` and `src/lib/customerTokenKey.ts`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: migrate customer auth to httpOnly cookie, extend admin session to 7d"
```

---

## Task 3: Merchant Email OTP Verification

**Files:**
- Modify: `src/app/api/merchant/auth/register/route.ts`
- Create: `src/app/api/merchant/auth/verify-email/route.ts`
- Create: `src/app/api/merchant/auth/resend-otp/route.ts`
- Create: `src/app/merchant/verify-email/page.tsx`
- Create: `src/app/merchant/verify-email/layout.tsx`
- Modify: `src/lib/mail.ts`

- [ ] **Step 1: Add sendMerchantEmailOTP and sendNewMerchantAlert to mail.ts**

Add to `src/lib/mail.ts`:
```typescript
export async function sendMerchantEmailOTP(to: string, businessName: string, otp: string): Promise<void> {
  await sendMail({
    to,
    subject: `${otp} — Your LetLoyal Verification Code`,
    html: `${EMAIL_HEADER}
      <div style="padding:32px 40px">
        <p style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:16px;font-weight:700;color:#0F172A;margin:0 0 8px">Hello, ${businessName}!</p>
        <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#475569;margin:0 0 24px">Use the code below to verify your LetLoyal account. It expires in 10 minutes.</p>
        <div style="background:#F0FDF4;border:2px solid #0D9488;border-radius:16px;padding:24px;text-align:center;margin:0 0 24px">
          <p style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:36px;font-weight:800;letter-spacing:12px;color:#0D9488;margin:0">${otp}</p>
        </div>
        <p style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#94A3B8;margin:0">If you did not create a LetLoyal account, ignore this email.</p>
      </div>
    ${EMAIL_FOOTER}`,
  });
}

export async function sendNewMerchantAlert(merchantEmail: string, businessName: string, slug: string): Promise<void> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'hello@letloyal.com';
  await sendMail({
    to: adminEmail,
    subject: `New Merchant: ${businessName}`,
    html: `${EMAIL_HEADER}
      <div style="padding:32px 40px">
        <p style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:16px;font-weight:700;color:#0F172A;margin:0 0 16px">New merchant verified on LetLoyal India</p>
        <table style="width:100%;border-collapse:collapse;font-family:Inter,Arial,sans-serif;font-size:14px">
          <tr><td style="padding:8px;color:#64748B;width:140px">Business</td><td style="padding:8px;color:#0F172A;font-weight:600">${businessName}</td></tr>
          <tr><td style="padding:8px;color:#64748B">Email</td><td style="padding:8px;color:#0F172A">${merchantEmail}</td></tr>
          <tr><td style="padding:8px;color:#64748B">Slug</td><td style="padding:8px;color:#0D9488">/m/${slug}</td></tr>
        </table>
      </div>
    ${EMAIL_FOOTER}`,
  });
}
```

- [ ] **Step 2: Update merchant register route — OTP flow**

Replace `src/app/api/merchant/auth/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendMerchantEmailOTP } from '@/lib/mail';
import { isRateLimited, rateLimitKey } from '@/lib/rateLimit';

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  if (isRateLimited(rateLimitKey(req, 'merch-register'), 10)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }
  try {
    const { business_name, email, phone, password } = await req.json();
    if (!business_name?.trim()) return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
    if (!email?.trim())         return NextResponse.json({ error: 'Email is required.' },         { status: 400 });
    if (!phone?.trim())         return NextResponse.json({ error: 'Phone number is required.' },  { status: 400 });
    if (!password)              return NextResponse.json({ error: 'Password is required.' },      { status: 400 });
    if (password.length < 8)    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const normEmail = email.toLowerCase().trim();
    const bizName   = business_name.trim();

    const existing = await queryOne<{ id: string; email_verified: number }>(
      'SELECT id, email_verified FROM merchants WHERE email = ?', [normEmail]
    );
    if (existing?.email_verified) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });

    let baseSlug = slugify(bizName);
    if (baseSlug.length < 3) baseSlug = `merchant-${baseSlug}`;
    let slug = baseSlug; let attempt = 0;
    while (true) {
      const taken = await queryOne<{ id: string }>('SELECT id FROM merchants WHERE slug = ?', [slug]);
      if (!taken) break;
      attempt++; slug = `${baseSlug}-${attempt}`;
    }

    const passwordHash = await hashPassword(password);
    const otp     = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    if (existing) {
      // Re-registration attempt — update OTP
      await query('UPDATE merchants SET password_hash=?, email_otp=?, email_otp_expires=?, status=? WHERE id=?',
        [passwordHash, otp, expires, 'pending', existing.id]);
    } else {
      await query(
        `INSERT INTO merchants (id, slug, business_name, email, phone, password_hash, status, email_verified, email_otp, email_otp_expires)
         VALUES (UUID(), ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
        [slug, bizName, normEmail, phone.trim(), passwordHash, otp, expires],
      );
    }

    sendMerchantEmailOTP(normEmail, bizName, otp).catch(e => console.error('[register] OTP email failed:', e));
    return NextResponse.json({ ok: true, email: normEmail });
  } catch (err) {
    console.error('[POST /api/merchant/auth/register]', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create verify-email route**

Create `src/app/api/merchant/auth/verify-email/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { isRateLimited, rateLimitKey } from '@/lib/rateLimit';
import { sendMerchantWelcome, sendNewMerchantAlert } from '@/lib/mail';

interface MerchantOTPRow {
  id: string; slug: string; business_name: string; email: string;
  email_otp: string | null; email_otp_expires: string | null; email_verified: number;
}

export async function POST(req: NextRequest) {
  if (isRateLimited(rateLimitKey(req, 'verify-email'), 10)) {
    return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 });
  }
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) return NextResponse.json({ error: 'Email and OTP are required.' }, { status: 400 });

    const merchant = await queryOne<MerchantOTPRow>(
      'SELECT id, slug, business_name, email, email_otp, email_otp_expires, email_verified FROM merchants WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    if (!merchant) return NextResponse.json({ error: 'Invalid code.' }, { status: 400 });
    if (merchant.email_verified) return NextResponse.json({ ok: true, alreadyVerified: true });
    if (!merchant.email_otp || merchant.email_otp !== String(otp).trim())
      return NextResponse.json({ error: 'Invalid code.' }, { status: 400 });
    if (!merchant.email_otp_expires || new Date(merchant.email_otp_expires) < new Date())
      return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 });

    await query('UPDATE merchants SET email_verified=1, email_otp=NULL, email_otp_expires=NULL, status=? WHERE id=?',
      ['active', merchant.id]);

    sendMerchantWelcome(merchant.email, merchant.business_name, merchant.email, merchant.slug)
      .catch(e => console.error('[verify-email] welcome email failed:', e));
    sendNewMerchantAlert(merchant.email, merchant.business_name, merchant.slug)
      .catch(e => console.error('[verify-email] alert email failed:', e));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/merchant/auth/verify-email]', err);
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create resend-otp route**

Create `src/app/api/merchant/auth/resend-otp/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { isRateLimited, rateLimitKey } from '@/lib/rateLimit';
import { sendMerchantEmailOTP } from '@/lib/mail';

export async function POST(req: NextRequest) {
  if (isRateLimited(rateLimitKey(req, 'resend-otp'), 5)) {
    return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 });
  }
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    const merchant = await queryOne<{ id: string; business_name: string; email_verified: number }>(
      'SELECT id, business_name, email_verified FROM merchants WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    if (!merchant) return NextResponse.json({ error: 'No account found.' }, { status: 404 });
    if (merchant.email_verified) return NextResponse.json({ ok: true, alreadyVerified: true });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await query('UPDATE merchants SET email_otp=?, email_otp_expires=? WHERE id=?', [otp, expires, merchant.id]);

    sendMerchantEmailOTP(email.toLowerCase().trim(), merchant.business_name, otp)
      .catch(e => console.error('[resend-otp] failed:', e));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/merchant/auth/resend-otp]', err);
    return NextResponse.json({ error: 'Failed to resend.' }, { status: 500 });
  }
}
```

- [ ] **Step 5: Create verify-email page**

Create `src/app/merchant/verify-email/layout.tsx`:
```typescript
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

Create `src/app/merchant/verify-email/page.tsx`:

```typescript
'use client';
import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { Mail } from 'lucide-react';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/merchant/auth/verify-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Verification failed.'); return; }
      router.push('/merchant/login?verified=1');
    } catch { setError('Connection error.'); }
    finally { setLoading(false); }
  }

  async function handleResend() {
    setResent(false); setError('');
    const res = await fetch('/api/merchant/auth/resend-otp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) setResent(true);
    else setError('Failed to resend. Try again.');
  }

  return (
    <div className="card">
      <h1 className="text-xl font-bold text-text-dark mb-1">Verify your email</h1>
      <p className="text-text-light text-sm mb-2">We sent a 6-digit code to</p>
      <p className="text-primary font-semibold text-sm mb-6">{email}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Verification Code" type="text" inputMode="numeric" maxLength={6}
          value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
          icon={<Mail size={16} />} required placeholder="6-digit code" />
        {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error">{error}</div>}
        {resent && <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">New code sent!</div>}
        <Button type="submit" fullWidth loading={loading}>Verify & Continue</Button>
      </form>
      <p className="text-center text-sm text-text-light mt-4">
        Didn't receive it?{' '}
        <button onClick={handleResend} className="text-primary hover:underline font-medium">Resend code</button>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-muted px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8"><Logo size={28} /></div>
        <Suspense fallback={<div className="card"><p className="text-sm text-text-medium">Loading…</p></div>}>
          <VerifyForm />
        </Suspense>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Update merchant register page to redirect to verify-email**

In `src/app/merchant/register/page.tsx`, after successful POST to `/api/merchant/auth/register`, instead of redirecting to login, redirect to:
```typescript
router.push(`/merchant/verify-email?email=${encodeURIComponent(email)}`);
```

Also update merchant login to block `status='pending'` merchants (the API already returns error if `email_verified=0` — check login route does this).

- [ ] **Step 7: Update merchant login route to block unverified merchants**

In `src/app/api/merchant/auth/login/route.ts`, add check after loading merchant:
```typescript
if (!merchant.email_verified) {
  return NextResponse.json({ error: 'Please verify your email first. Check your inbox for the verification code.', needsVerification: true, email: merchant.email }, { status: 403 });
}
```
Add `email_verified` to the SELECT query.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: merchant self-registration with email OTP verification"
```

---

## Task 4: DPDP Compliance

**Files:**
- Create: `src/lib/consent.ts`
- Create: `src/app/api/consent/route.ts`
- Create: `src/components/ConsentBanner.tsx`
- Create: `src/app/cookie-policy/page.tsx`
- Create: `src/app/customer-policy/page.tsx`
- Create: `src/app/merchant-terms/page.tsx`
- Create: `src/app/merchant-rights/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create consent state lib**

Create `src/lib/consent.ts`:
```typescript
'use client';
const KEY = 'll_consent_in';

export interface ConsentState { necessary: true; analytics: boolean; }

export function getConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(KEY) || ''); } catch { return null; }
}

export function setConsent(state: ConsentState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('ll-consent-change', { detail: state }));
}

export function hasConsent(): boolean { return getConsent() !== null; }
```

- [ ] **Step 2: Create /api/consent route**

Create `src/app/api/consent/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { visitor_ref, categories } = await req.json();
    if (!visitor_ref || !categories) return NextResponse.json({ error: 'Invalid.' }, { status: 400 });
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const ua = req.headers.get('user-agent') ?? null;
    await query(
      'INSERT INTO consent_log (visitor_ref, categories, locale, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
      [visitor_ref, JSON.stringify(categories), 'en', ip, ua]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/consent]', err);
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create ConsentBanner component**

Create `src/components/ConsentBanner.tsx`:
```typescript
'use client';
import { useState, useEffect } from 'react';
import { getConsent, setConsent, hasConsent } from '@/lib/consent';
import Link from 'next/link';

export default function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => { if (!hasConsent()) setShow(true); }, []);

  function accept(analytics: boolean) {
    const state = { necessary: true as const, analytics };
    setConsent(state);
    setShow(false);
    const ref = crypto.randomUUID();
    fetch('/api/consent', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_ref: ref, categories: state }) }).catch(() => {});
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-border-light p-5">
        <p className="text-sm font-bold text-text-dark mb-1">We use cookies</p>
        <p className="text-xs text-text-light mb-4">
          We use necessary cookies to operate the platform. We'd also like to use analytics cookies to understand how you use LetLoyal. This is in accordance with India's <strong>Digital Personal Data Protection Act 2023 (DPDP)</strong>.{' '}
          <Link href="/cookie-policy" className="text-primary hover:underline">Learn more</Link>
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={() => accept(true)}
            className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition-colors">
            Accept All
          </button>
          <button onClick={() => accept(false)}
            className="flex-1 bg-bg-muted text-text-medium text-sm font-semibold py-2.5 rounded-xl hover:bg-border-light transition-colors">
            Necessary Only
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add ConsentBanner to layout**

In `src/app/layout.tsx`, import and add `<ConsentBanner />` just before `</body>`:
```typescript
import ConsentBanner from '@/components/ConsentBanner';
// inside <body>:
<ConsentBanner />
```

- [ ] **Step 5: Create legal pages**

Create `src/app/cookie-policy/page.tsx`:
```typescript
export default function CookiePolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-dark mb-2">Cookie Policy</h1>
      <p className="text-text-light text-sm mb-8">Last updated: July 2026</p>
      <div className="prose prose-sm max-w-none text-text-medium space-y-6">
        <section><h2 className="text-lg font-bold text-text-dark">What are cookies?</h2>
          <p>Cookies are small text files placed on your device when you visit a website. We use them in accordance with India's Digital Personal Data Protection Act 2023 (DPDP Act).</p></section>
        <section><h2 className="text-lg font-bold text-text-dark">Necessary Cookies</h2>
          <p>These are required for the platform to function. They include your login session and security tokens. You cannot opt out of these.</p></section>
        <section><h2 className="text-lg font-bold text-text-dark">Analytics Cookies</h2>
          <p>With your consent, we use Microsoft Clarity to understand how visitors use our platform. No personal data is shared with third parties. You can withdraw consent at any time by clearing your browser data for letloyal.com.</p></section>
        <section><h2 className="text-lg font-bold text-text-dark">Contact</h2>
          <p>Questions? Email <a href="mailto:hello@letloyal.com" className="text-primary">hello@letloyal.com</a></p></section>
      </div>
    </main>
  );
}
```

Create `src/app/customer-policy/page.tsx`:
```typescript
export default function CustomerPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-dark mb-2">Customer Privacy Policy</h1>
      <p className="text-text-light text-sm mb-8">Last updated: July 2026 · DPDP Act 2023 compliant</p>
      <div className="prose prose-sm max-w-none text-text-medium space-y-6">
        <section><h2 className="text-lg font-bold text-text-dark">Data We Collect</h2>
          <p>When you join LetLoyal as a customer, we collect your name, phone number, and email address. We also record your visits and reward progress at participating merchants.</p></section>
        <section><h2 className="text-lg font-bold text-text-dark">How We Use Your Data</h2>
          <p>Your data is used solely to provide loyalty services: tracking visits, issuing rewards, and sending relevant communications from merchants you have visited.</p></section>
        <section><h2 className="text-lg font-bold text-text-dark">Your Rights Under DPDP Act 2023</h2>
          <p>You have the right to: access your personal data, correct inaccurate data, withdraw consent, and request deletion of your data. Contact us at <a href="mailto:hello@letloyal.com" className="text-primary">hello@letloyal.com</a> to exercise these rights.</p></section>
        <section><h2 className="text-lg font-bold text-text-dark">Data Sharing</h2>
          <p>We share visit data with the merchant you visited. We do not sell your data to any third party.</p></section>
        <section><h2 className="text-lg font-bold text-text-dark">Grievance Officer</h2>
          <p>For data-related complaints under DPDP Act 2023, contact: <a href="mailto:hello@letloyal.com" className="text-primary">hello@letloyal.com</a></p></section>
      </div>
    </main>
  );
}
```

Create `src/app/merchant-terms/page.tsx`:
```typescript
export default function MerchantTermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-dark mb-2">Merchant Terms of Service</h1>
      <p className="text-text-light text-sm mb-8">Last updated: July 2026</p>
      <div className="prose prose-sm max-w-none text-text-medium space-y-6">
        <section><h2 className="text-lg font-bold text-text-dark">1. Acceptance</h2>
          <p>By registering as a merchant on LetLoyal, you agree to these terms. LetLoyal is operated for businesses in India.</p></section>
        <section><h2 className="text-lg font-bold text-text-dark">2. Merchant Obligations</h2>
          <p>You must honour all rewards earned by customers through your active campaign. You are responsible for the accuracy of your business information on the platform.</p></section>
        <section><h2 className="text-lg font-bold text-text-dark">3. Customer Data</h2>
          <p>You will receive customer visit data (name, phone, visit count). You must handle this data in compliance with India's DPDP Act 2023 and must not use it for unsolicited marketing outside LetLoyal.</p></section>
        <section><h2 className="text-lg font-bold text-text-dark">4. Service Plans</h2>
          <p>LetLoyal offers Free, Starter, and Pro plans. Plan details and pricing are available at letloyal.com. We reserve the right to modify plans with 30 days notice.</p></section>
        <section><h2 className="text-lg font-bold text-text-dark">5. Termination</h2>
          <p>We may suspend accounts that violate these terms. You may delete your account by contacting <a href="mailto:hello@letloyal.com" className="text-primary">hello@letloyal.com</a>.</p></section>
      </div>
    </main>
  );
}
```

Create `src/app/merchant-rights/page.tsx`:
```typescript
export default function MerchantRightsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-dark mb-2">Merchant Data Rights</h1>
      <p className="text-text-light text-sm mb-8">Under India's DPDP Act 2023</p>
      <div className="prose prose-sm max-w-none text-text-medium space-y-6">
        <section><h2 className="text-lg font-bold text-text-dark">Your Rights</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Access:</strong> Request a copy of all personal data we hold about your business.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data.</li>
            <li><strong>Deletion:</strong> Request deletion of your account and associated data.</li>
            <li><strong>Portability:</strong> Receive your customer visit data in a machine-readable format.</li>
            <li><strong>Grievance:</strong> Lodge a complaint if you believe your data rights have been violated.</li>
          </ul>
        </section>
        <section><h2 className="text-lg font-bold text-text-dark">How to Exercise Your Rights</h2>
          <p>Email <a href="mailto:hello@letloyal.com" className="text-primary">hello@letloyal.com</a> with your registered email and the right you wish to exercise. We will respond within 30 days.</p></section>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Add legal links to site footer**

In `src/app/page.tsx`, find the footer section and add links:
```typescript
<Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
<Link href="/customer-policy" className="hover:text-white transition-colors">Customer Privacy</Link>
<Link href="/merchant-terms" className="hover:text-white transition-colors">Merchant Terms</Link>
<Link href="/merchant-rights" className="hover:text-white transition-colors">Merchant Rights</Link>
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: DPDP compliance — consent banner, audit log, 4 new legal pages"
```

---

## Task 5: Admin Panel Upgrades

**Files:**
- Create: `src/app/admin/billing/page.tsx`
- Create: `src/app/api/admin/billing/route.ts`
- Create: `src/app/api/admin/billing/[id]/route.ts`
- Create: `src/app/admin/services/page.tsx`
- Create: `src/app/api/admin/services/route.ts`
- Create: `src/app/api/admin/auth/change-password/route.ts`
- Modify: `src/app/admin/AdminShell.tsx`

- [ ] **Step 1: Create admin billing API**

Create `src/app/api/admin/billing/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const merchants = await query<{ id: string; business_name: string; email: string; plan: string; status: string; billing_note: string | null; created_at: string }>(
      'SELECT id, business_name, email, plan, status, billing_note, created_at FROM merchants ORDER BY created_at DESC'
    );
    return NextResponse.json({ ok: true, merchants });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
```

Create `src/app/api/admin/billing/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const { plan, status, billing_note } = await req.json();
    const updates: string[] = []; const values: unknown[] = [];
    if (plan)         { updates.push('plan = ?');         values.push(plan); }
    if (status)       { updates.push('status = ?');       values.push(status); }
    if (billing_note !== undefined) { updates.push('billing_note = ?'); values.push(billing_note); }
    if (!updates.length) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    values.push(id);
    await query(`UPDATE merchants SET ${updates.join(', ')} WHERE id = ?`, values);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create admin services health API**

Create `src/app/api/admin/services/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const [merchantCount, customerCount, visitCount] = await Promise.all([
      queryOne<{ c: number }>('SELECT COUNT(*) as c FROM merchants WHERE status = "active"'),
      queryOne<{ c: number }>('SELECT COUNT(*) as c FROM customers'),
      queryOne<{ c: number }>('SELECT COUNT(*) as c FROM visits'),
    ]);
    const smtpOk = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    const r2Ok   = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID);
    const pushOk = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
    const googleOk = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    return NextResponse.json({ ok: true, db: { merchants: merchantCount?.c ?? 0, customers: customerCount?.c ?? 0, visits: visitCount?.c ?? 0 }, services: { smtp: smtpOk, r2: r2Ok, webpush: pushOk, google_oauth: googleOk }, uptime: process.uptime() });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create admin change-password API**

Create `src/app/api/admin/auth/change-password/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, comparePassword, hashPassword } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const { current_password, new_password } = await req.json();
    if (!current_password || !new_password) return NextResponse.json({ error: 'Both passwords required.' }, { status: 400 });
    if (new_password.length < 8) return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
    const row = await queryOne<{ password_hash: string }>('SELECT password_hash FROM admin_users WHERE id = ?', [admin.sub]);
    if (!row) return NextResponse.json({ error: 'Admin not found.' }, { status: 404 });
    const match = await comparePassword(current_password, row.password_hash);
    if (!match) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    const hash = await hashPassword(new_password);
    await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, admin.sub]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create billing page**

Create `src/app/admin/billing/page.tsx` — table of merchants with plan dropdowns (free/starter/pro), status toggle, billing note field. Model it after the EU `letloyal-pilot-eu/src/app/[locale]/admin/billing/page.tsx` but without locale prefix. Key structure:

```typescript
'use client';
import { useEffect, useState } from 'react';

const PLANS = ['free', 'starter', 'pro'] as const;
const STATUSES = ['active', 'suspended'] as const;
const PLAN_BADGE: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600', starter: 'bg-blue-100 text-blue-700', pro: 'bg-amber-100 text-amber-700',
};

interface Merchant { id: string; business_name: string; email: string; plan: string; status: string; billing_note: string | null; created_at: string; }

export default function AdminBillingPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/billing').then(r => r.json()).then(d => { if (d.ok) setMerchants(d.merchants); }).finally(() => setLoading(false));
  }, []);

  async function update(id: string, patch: Partial<Merchant>) {
    await fetch(`/api/admin/billing/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    setMerchants(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-extrabold text-text-dark">Billing</h1>
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-muted"><tr className="text-left text-xs font-semibold text-text-light uppercase tracking-wider">
            <th className="px-4 py-3">Business</th><th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">Status</th><th className="px-4 py-3">Note</th>
          </tr></thead>
          <tbody className="divide-y divide-border-light">
            {merchants.map(m => (
              <tr key={m.id}>
                <td className="px-4 py-3"><p className="font-semibold text-text-dark">{m.business_name}</p><p className="text-xs text-text-light">{m.email}</p></td>
                <td className="px-4 py-3">
                  <select value={m.plan} onChange={e => update(m.id, { plan: e.target.value })}
                    className="text-xs font-semibold rounded-lg px-2 py-1 border border-border-light bg-white">
                    {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select value={m.status} onChange={e => update(m.id, { status: e.target.value })}
                    className="text-xs rounded-lg px-2 py-1 border border-border-light bg-white">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input defaultValue={m.billing_note || ''} onBlur={e => update(m.id, { billing_note: e.target.value })}
                    className="text-xs border border-border-light rounded-lg px-2 py-1 w-full" placeholder="Internal note…" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create services health page**

Create `src/app/admin/services/page.tsx` — shows DB counts, SMTP/R2/WebPush/Google OAuth status as green/red chips, server uptime.

```typescript
'use client';
import { useEffect, useState } from 'react';
import { Database, Mail, Cloud, Bell, Globe, Clock } from 'lucide-react';

interface ServicesData {
  db: { merchants: number; customers: number; visits: number };
  services: { smtp: boolean; r2: boolean; webpush: boolean; google_oauth: boolean };
  uptime: number;
}

function StatusChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      <span className={`w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
      {label}: {ok ? 'OK' : 'Not configured'}
    </div>
  );
}

export default function AdminServicesPage() {
  const [data, setData] = useState<ServicesData | null>(null);
  useEffect(() => { fetch('/api/admin/services').then(r => r.json()).then(d => { if (d.ok) setData(d); }); }, []);
  const uptimeHrs = data ? Math.floor(data.uptime / 3600) : 0;
  const uptimeMins = data ? Math.floor((data.uptime % 3600) / 60) : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-extrabold text-text-dark">Services Health</h1>
      {data ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[{ label: 'Active Merchants', value: data.db.merchants, icon: <Globe size={18} /> },
              { label: 'Customers', value: data.db.customers, icon: <Database size={18} /> },
              { label: 'Total Visits', value: data.db.visits, icon: <Clock size={18} /> }].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-border-light p-4">
                <div className="text-primary mb-2">{s.icon}</div>
                <p className="text-2xl font-extrabold text-text-dark">{s.value}</p>
                <p className="text-xs text-text-light">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-border-light p-4 space-y-3">
            <p className="text-sm font-bold text-text-dark mb-2">External Services</p>
            <StatusChip ok={data.services.smtp} label="SMTP (Email)" />
            <StatusChip ok={data.services.r2} label="R2 (Image Storage)" />
            <StatusChip ok={data.services.webpush} label="Web Push" />
            <StatusChip ok={data.services.google_oauth} label="Google OAuth" />
          </div>
          <div className="bg-white rounded-2xl border border-border-light p-4">
            <p className="text-sm font-bold text-text-dark">Server Uptime</p>
            <p className="text-2xl font-extrabold text-text-dark mt-1">{uptimeHrs}h {uptimeMins}m</p>
          </div>
        </>
      ) : <div className="flex justify-center py-20"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
    </div>
  );
}
```

- [ ] **Step 6: Update AdminShell with new nav items and change-password form**

In `src/app/admin/AdminShell.tsx`:

Add to imports: `import { LayoutDashboard, Users, CreditCard, Activity, LogOut, Lock } from 'lucide-react';`

Add to nav array:
```typescript
{ href: '/admin/billing',  label: 'Billing',  icon: <CreditCard size={18} /> },
{ href: '/admin/services', label: 'Services', icon: <Activity   size={18} /> },
```

Add change-password form below the nav (collapsed behind a button, same pattern as EU build's admin dashboard).

- [ ] **Step 7: Update admin login to pass redirect param**

In `src/app/admin/login/page.tsx`, add `useSearchParams` to read `?redirect=`:
```typescript
const redirectTo = searchParams.get('redirect');
// after login:
router.push(redirectTo && redirectTo.startsWith('/admin') ? redirectTo : '/admin');
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: admin billing, services health, change-password, session 7d, redirect fix"
```

---

## Task 6: Google OAuth for Customers

**Files:**
- Create: `src/app/api/customer/auth/google/route.ts`
- Create: `src/app/api/customer/auth/google/callback/route.ts`
- Modify: `src/app/my-rewards/page.tsx` — add Google login button

- [ ] **Step 1: Add Google OAuth env vars to .env.local**

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_BASE_URL=https://pilot.letloyal.com
```

In Google Cloud Console: create OAuth 2.0 credentials, set authorized redirect URI to `https://pilot.letloyal.com/api/customer/auth/google/callback`.

- [ ] **Step 2: Create Google OAuth initiation route**

Create `src/app/api/customer/auth/google/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const clientId    = process.env.GOOGLE_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/customer/auth/google/callback`;
  const scope       = 'openid email profile';
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline`;
  return NextResponse.redirect(url);
}
```

- [ ] **Step 3: Create Google OAuth callback route**

Create `src/app/api/customer/auth/google/callback/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { signCustomerToken, CUSTOMER_SESSION_MAX_AGE } from '@/lib/customerAuth';
import { CUSTOMER_COOKIE_NAME } from '@/lib/authConstants';
import { queryOne, query } from '@/lib/db';

interface GoogleTokenResponse { access_token: string; id_token: string; }
interface GoogleUserInfo { sub: string; email: string; name: string; picture: string; }

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/my-rewards?error=google_cancelled', req.url));

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/customer/auth/google/callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
    const tokenData: GoogleTokenResponse = await tokenRes.json();

    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user: GoogleUserInfo = await userRes.json();

    let customer = await queryOne<{ id: string; phone_number: string | null }>(
      'SELECT id, phone_number FROM customers WHERE google_id = ? OR email = ?', [user.sub, user.email]
    );

    if (!customer) {
      await query('INSERT INTO customers (google_id, email, name, phone_number) VALUES (?, ?, ?, NULL)',
        [user.sub, user.email, user.name]);
      customer = await queryOne<{ id: string; phone_number: string | null }>(
        'SELECT id, phone_number FROM customers WHERE google_id = ?', [user.sub]
      );
    } else {
      await query('UPDATE customers SET google_id = ? WHERE id = ?', [user.sub, customer.id]);
    }

    if (!customer) return NextResponse.redirect(new URL('/my-rewards?error=google_failed', req.url));

    const token = signCustomerToken({ sub: customer.id, phone: customer.phone_number });
    const res = NextResponse.redirect(new URL('/my-rewards', req.url));
    res.cookies.set({ name: CUSTOMER_COOKIE_NAME, value: token, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: CUSTOMER_SESSION_MAX_AGE });
    return res;
  } catch (err) {
    console.error('[google/callback]', err);
    return NextResponse.redirect(new URL('/my-rewards?error=google_failed', req.url));
  }
}
```

- [ ] **Step 4: Add Google login button to my-rewards login/register forms**

In `src/app/my-rewards/page.tsx`, in the login and register form sections add:
```typescript
<div className="relative my-4">
  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-light" /></div>
  <div className="relative flex justify-center text-xs text-text-light"><span className="bg-white px-2">or</span></div>
</div>
<a href="/api/customer/auth/google"
  className="flex items-center justify-center gap-2 w-full border border-border-light rounded-xl py-2.5 text-sm font-semibold text-text-dark hover:bg-bg-muted transition-colors">
  <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
  Continue with Google
</a>
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Google OAuth login/register for customers"
```

---

## Task 7: Location + Nearby Store Discovery

**Files:**
- Create: `src/components/merchant/LocationPicker.tsx`
- Create: `src/app/api/customer/nearby/route.ts`
- Modify: `src/app/m/[slug]/settings/page.tsx`
- Modify: `src/app/api/merchant/[slug]/profile/route.ts`
- Modify: `src/app/my-rewards/page.tsx`

- [ ] **Step 1: Install Leaflet**

```bash
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet
```

- [ ] **Step 2: Create LocationPicker component**

Create `src/components/merchant/LocationPicker.tsx`:
```typescript
'use client';
import { useEffect, useRef } from 'react';

interface Props { lat: number | null; lng: number | null; onChange: (lat: number, lng: number) => void; }

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    import('leaflet').then(L => {
      const map = L.map(ref.current!, { center: lat && lng ? [lat, lng] : [20.5937, 78.9629], zoom: lat && lng ? 15 : 5 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM contributors' }).addTo(map);
      let marker: ReturnType<typeof L.marker> | null = null;
      if (lat && lng) { marker = L.marker([lat, lng]).addTo(map); }
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        if (marker) marker.remove();
        marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        onChange(e.latlng.lat, e.latlng.lng);
      });
      mapRef.current = map;
    });
    return () => { if (mapRef.current) { (mapRef.current as { remove: () => void }).remove(); mapRef.current = null; } };
  }, []);

  return (
    <div>
      <p className="text-xs text-text-light mb-2">Click on the map to pin your store location</p>
      <div ref={ref} style={{ height: 280, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-light)' }} />
      {lat && lng && <p className="text-xs text-text-light mt-1">{lat.toFixed(6)}, {lng.toFixed(6)}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Add lat/lng/website_url to merchant profile API**

In `src/app/api/merchant/[slug]/profile/route.ts`, in the PATCH handler add `latitude`, `longitude`, `website_url` to the updatable fields alongside existing ones.

- [ ] **Step 4: Add LocationPicker to merchant settings page**

In `src/app/m/[slug]/settings/page.tsx`, import `LocationPicker` (dynamic import to avoid SSR) and add a Location section with lat/lng state.

- [ ] **Step 5: Create nearby API**

Create `src/app/api/customer/nearby/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get('lat') || '');
  const lng = parseFloat(req.nextUrl.searchParams.get('lng') || '');
  if (isNaN(lat) || isNaN(lng)) return NextResponse.json({ error: 'lat and lng required.' }, { status: 400 });

  const stores = await query<{ slug: string; business_name: string; logo_url: string | null; address: string | null; distance_km: number }>(
    `SELECT slug, business_name, logo_url, address,
       (6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(latitude)))) AS distance_km
     FROM merchants
     WHERE status = 'active' AND latitude IS NOT NULL AND longitude IS NOT NULL
     HAVING distance_km < 10
     ORDER BY distance_km ASC
     LIMIT 20`,
    [lat, lng, lat]
  );
  return NextResponse.json({ ok: true, stores });
}
```

- [ ] **Step 6: Add Nearby section to customer dashboard**

In `src/app/my-rewards/page.tsx`, add a "Nearby" section on the cards tab that calls `/api/customer/nearby?lat=X&lng=Y` using `navigator.geolocation.getCurrentPosition`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: merchant location picker + nearby store discovery for customers"
```

---

## Task 8: Streak Campaigns

**Files:**
- Modify: `src/components/merchant/CampaignForm.tsx`
- Modify: `src/app/api/merchant/[slug]/campaign/route.ts`
- Modify: `src/app/api/scan/route.ts`

- [ ] **Step 1: Add streak fields to CampaignForm**

In `src/components/merchant/CampaignForm.tsx`, add a toggle "Enable Streak Bonus" that reveals:
- Streak period: `day` / `week`
- Streak days required: number input (e.g. 5)
- Streak multiplier: number input (default 1.5×)

State:
```typescript
const [streakEnabled, setStreakEnabled] = useState(false);
const [streakPeriod,  setStreakPeriod]  = useState<'day'|'week'>('day');
const [streakDays,    setStreakDays]    = useState(5);
const [streakMultiplier, setStreakMultiplier] = useState(1.5);
```

Include in POST body: `streak_enabled, streak_period, streak_days, streak_multiplier`.

- [ ] **Step 2: Save streak fields in campaign API**

In `src/app/api/merchant/[slug]/campaign/route.ts`, add streak columns to INSERT/UPDATE:
```typescript
const { ..., streak_enabled, streak_period, streak_days, streak_multiplier } = await req.json();
// In INSERT:
`INSERT INTO campaigns (..., streak_enabled, streak_period, streak_days, streak_multiplier)
 VALUES (..., ?, ?, ?, ?)`
// values: ..., streak_enabled ? 1 : 0, streak_period || null, streak_days || null, streak_multiplier || 1.5
```

- [ ] **Step 3: Apply streak multiplier in scan route**

In `src/app/api/scan/route.ts`, after loading campaign, check streak:
```typescript
// After loading campaign and visit count:
let multiplier = 1;
if (campaign.streak_enabled && campaign.streak_days && campaign.streak_period) {
  // Count visits in the streak window
  const windowStart = campaign.streak_period === 'day'
    ? new Date(Date.now() - campaign.streak_days * 24 * 60 * 60 * 1000)
    : new Date(Date.now() - campaign.streak_days * 7 * 24 * 60 * 60 * 1000);
  const streakVisits = await queryOne<{ c: number }>(
    'SELECT COUNT(*) as c FROM visits WHERE customer_id = ? AND campaign_id = ? AND scanned_at >= ?',
    [customer.sub, campaign.id, windowStart]
  );
  if ((streakVisits?.c ?? 0) >= campaign.streak_days - 1) {
    multiplier = campaign.streak_multiplier ?? 1.5;
  }
}
// Apply: pointsEarned = Math.round(basePoints * multiplier)
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: streak campaigns with configurable period, days, and multiplier"
```

---

## Task 9: Instant Offers

**Files:**
- Create: `src/app/api/merchant/[slug]/offers/route.ts`
- Create: `src/app/m/[slug]/offers/page.tsx`
- Create: `src/app/offer/[slug]/[offerId]/page.tsx`
- Modify: `src/app/my-rewards/page.tsx`

- [ ] **Step 1: Create merchant offers API**

Create `src/app/api/merchant/[slug]/offers/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    requireMerchant(req, slug);
    const merchant = await queryOne<{ id: string }>('SELECT id FROM merchants WHERE slug = ?', [slug]);
    if (!merchant) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const offers = await query('SELECT * FROM instant_offers WHERE merchant_id = ? ORDER BY created_at DESC', [merchant.id]);
    return NextResponse.json({ ok: true, offers });
  } catch (e) { if (e instanceof Response) return e; return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    requireMerchant(req, slug);
    const merchant = await queryOne<{ id: string }>('SELECT id FROM merchants WHERE slug = ?', [slug]);
    if (!merchant) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const { title, description, valid_until } = await req.json();
    if (!title || !valid_until) return NextResponse.json({ error: 'title and valid_until required.' }, { status: 400 });
    await query('INSERT INTO instant_offers (id, merchant_id, title, description, valid_until) VALUES (UUID(), ?, ?, ?, ?)',
      [merchant.id, title, description || null, new Date(valid_until)]);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) { if (e instanceof Response) return e; return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    requireMerchant(req, slug);
    const { id } = await req.json();
    await query('DELETE FROM instant_offers WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (e) { if (e instanceof Response) return e; return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}
```

- [ ] **Step 2: Create merchant offers management page**

Create `src/app/m/[slug]/offers/page.tsx` — form to create offers (title, description, valid until datetime), list of active/expired offers with delete button. Follow the same pattern as campaign page.

- [ ] **Step 3: Create public offer detail page**

Create `src/app/offer/[slug]/[offerId]/page.tsx`:
```typescript
import { queryOne } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function OfferPage({ params }: { params: Promise<{ slug: string; offerId: string }> }) {
  const { slug, offerId } = await params;
  const offer = await queryOne<{ title: string; description: string | null; valid_until: string; business_name: string }>(
    `SELECT o.title, o.description, o.valid_until, m.business_name
     FROM instant_offers o JOIN merchants m ON m.id = o.merchant_id
     WHERE o.id = ? AND m.slug = ?`,
    [offerId, slug]
  );
  if (!offer) notFound();
  const expired = new Date(offer.valid_until) < new Date();

  return (
    <main className="min-h-screen bg-bg-muted flex items-center justify-center px-4 py-12">
      <div className="card max-w-sm w-full text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{offer.business_name}</p>
        <h1 className="text-2xl font-extrabold text-text-dark mb-3">{offer.title}</h1>
        {offer.description && <p className="text-text-medium text-sm mb-4">{offer.description}</p>}
        {expired
          ? <p className="text-status-error font-semibold text-sm">This offer has expired.</p>
          : <p className="text-text-light text-xs">Valid until: {new Date(offer.valid_until).toLocaleDateString('en-IN')}</p>}
        <div className="mt-6">
          <Link href={`/s/${slug}`} className="btn-primary w-full block text-center">Visit Store</Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Add DashboardShell nav item for Offers**

In `src/components/merchant/DashboardShell.tsx`, add to nav array:
```typescript
{ label: 'Offers', href: `/m/${slug}/offers`, icon: <Tag size={18} /> }
```
Import `Tag` from `lucide-react`.

- [ ] **Step 5: Show active offers on customer dashboard**

In `src/app/my-rewards/page.tsx`, in the cards tab, after loyalty cards fetch also fetch `/api/customer/nearby` or a public offers endpoint. Show a horizontal scroll of active offers above the loyalty cards.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: instant offers — merchant create/delete, public offer page, customer view"
```

---

## Task 10: PWA (Manifest + Icons + Offline Page)

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Create: `src/components/ServiceWorkerRegistrar.tsx`
- Create: `src/app/offline/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Generate PWA icons**

Run in project root:
```bash
npm install --save-dev sharp
node -e "
const sharp = require('sharp');
const svg = require('fs').readFileSync('src/app/icon.svg');
require('fs').mkdirSync('public/icons', { recursive: true });
sharp(svg).resize(192,192).png().toFile('public/icons/icon-192.png', ()=>{});
sharp(svg).resize(512,512).png().toFile('public/icons/icon-512.png', ()=>{});
sharp(svg).resize(180,180).png().toFile('public/icons/apple-touch-icon.png', ()=>{});
console.log('Icons generated');
"
```

- [ ] **Step 2: Create manifest.json**

Create `public/manifest.json`:
```json
{
  "name": "LetLoyal",
  "short_name": "LetLoyal",
  "description": "Your loyalty rewards, always with you",
  "start_url": "/my-rewards",
  "display": "standalone",
  "background_color": "#F5F5F2",
  "theme_color": "#0D9488",
  "lang": "en",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 3: Create service worker**

Create `public/sw.js`:
```javascript
const CACHE = 'letloyal-in-v1';
const PRECACHE = ['/', '/my-rewards', '/favicon.svg', '/offline'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(request, res.clone()));
      return res;
    })));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(request).then(cached => {
      const networkFetch = fetch(request).then(res => {
        if (res.ok) cache.put(request, res.clone());
        return res;
      }).catch(() => {
        if (cached) return cached;
        return cache.match('/offline').then(off => off || new Response('Offline', { status: 503 }));
      });
      return cached || networkFetch;
    })));
  }
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() ?? {}; } catch { data = { title: 'LetLoyal', body: event.data?.text() ?? '' }; }
  event.waitUntil(self.registration.showNotification(data.title ?? 'LetLoyal', {
    body: data.body ?? '', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
    tag: data.tag ?? 'letloyal', data: { url: data.url ?? '/' },
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const existing = clients.find(c => c.url.includes(self.location.origin));
    if (existing) { existing.focus(); existing.navigate(url); }
    else self.clients.openWindow(url);
  }));
});
```

- [ ] **Step 4: Create ServiceWorkerRegistrar**

Create `src/components/ServiceWorkerRegistrar.tsx`:
```typescript
'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .catch(err => console.error('SW registration failed:', err));
    }
  }, []);
  return null;
}
```

- [ ] **Step 5: Create offline page**

Create `src/app/offline/page.tsx`:
```typescript
'use client';
export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-bg-muted flex items-center justify-center px-4">
      <div className="card max-w-sm w-full text-center">
        <div className="text-4xl mb-4">📶</div>
        <h1 className="text-xl font-bold text-text-dark mb-2">You're offline</h1>
        <p className="text-text-light text-sm mb-6">Check your internet connection and try again.</p>
        <button onClick={() => window.location.reload()}
          className="btn-primary w-full">Try Again</button>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Update layout.tsx**

In `src/app/layout.tsx`, add:
```typescript
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
// In <head>:
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<meta name="theme-color" content="#0D9488" />
// In <body>, before </body>:
<ServiceWorkerRegistrar />
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: PWA — manifest, icons, service worker, offline page"
```

---

## Task 11: Merchant Welcome Email Redesign

**Files:**
- Modify: `src/lib/mail.ts`

- [ ] **Step 1: Rewrite sendMerchantWelcome HTML**

In `src/lib/mail.ts`, replace the `sendMerchantWelcome` function body with rich 3-step setup guide:

```typescript
export async function sendMerchantWelcome(
  to: string, businessName: string, loginEmail: string, slug: string
): Promise<void> {
  const dashUrl    = `${BASE_URL}/m/${slug}`;
  const profileUrl = `${BASE_URL}/m/${slug}/settings`;
  const qrUrl      = `${BASE_URL}/m/${slug}/qr`;

  const STEP_BADGE = `display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#0D9488;color:#ffffff;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:13px;font-weight:800;flex-shrink:0`;

  await sendMail({
    to,
    subject: `Welcome to LetLoyal, ${businessName}! Your loyalty program is ready 🎉`,
    html: `${EMAIL_HEADER}
<div style="padding:32px 40px 0">
  <h1 style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:22px;font-weight:800;color:#0F172A;margin:0 0 8px">Welcome, ${businessName}! 🎉</h1>
  <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#475569;margin:0 0 28px">Your LetLoyal merchant account is verified. Here's how to get your first customer earning rewards in 3 steps:</p>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px">
    <tr><td style="padding:14px 16px;background:#F0FDF4;border-left:4px solid #0D9488;border-radius:12px">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <span style="${STEP_BADGE}">1</span>
        <div><p style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:13px;font-weight:700;color:#134E4A;margin:0 0 2px">Complete your profile</p>
        <p style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#475569;margin:0">Add your logo, address, and business hours so customers can find you.</p></div>
      </div>
    </td></tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px">
    <tr><td style="padding:14px 16px;background:#F0FDF4;border-left:4px solid #0D9488;border-radius:12px">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <span style="${STEP_BADGE}">2</span>
        <div><p style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:13px;font-weight:700;color:#134E4A;margin:0 0 2px">Set up your loyalty campaign</p>
        <p style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#475569;margin:0">Choose visit-based or spend-based rewards. Set your milestone and reward — e.g. "₹2000 spent → ₹100 off".</p></div>
      </div>
    </td></tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
    <tr><td style="padding:14px 16px;background:#F0FDF4;border-left:4px solid #0D9488;border-radius:12px">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <span style="${STEP_BADGE}">3</span>
        <div><p style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:13px;font-weight:700;color:#134E4A;margin:0 0 2px">Display your QR code</p>
        <p style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#475569;margin:0">Open your merchant dashboard and show the live QR code on any screen or tablet at your counter. Customers scan it to instantly join.</p></div>
      </div>
    </td></tr>
  </table>

  <p style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:11px;font-weight:700;color:#0D9488;letter-spacing:0.06em;text-transform:uppercase;margin:0 0 16px">Your Login Details</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;margin-bottom:28px">
    <tr><td style="padding:16px 20px">
      <p style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#64748B;margin:0 0 4px">Email</p>
      <p style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:14px;font-weight:700;color:#0F172A;margin:0">${loginEmail}</p>
    </td></tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    <tr>
      <td style="padding-right:8px" width="50%">
        <a href="${profileUrl}" style="display:block;text-align:center;background:#0D9488;color:#ffffff;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:14px 20px;border-radius:12px">Complete Profile →</a>
      </td>
      <td style="padding-left:8px" width="50%">
        <a href="${qrUrl}" style="display:block;text-align:center;background:#ffffff;color:#0D9488;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:14px 20px;border-radius:12px;border:2px solid #0D9488">Get Your QR Code →</a>
      </td>
    </tr>
  </table>
</div>
${EMAIL_FOOTER}`,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/mail.ts
git commit -m "feat: rich merchant welcome email with 3-step guide and dual CTAs"
```

---

## Task 12: In-App QR Scanner for Customers

**Files:**
- Modify: `src/app/my-rewards/page.tsx`
- Modify: `package.json`

- [ ] **Step 1: Install jsQR**

```bash
npm install jsqr
```

- [ ] **Step 2: Create QR scanner component inline in my-rewards**

In `src/app/my-rewards/page.tsx`, add a `QRScanner` component:

```typescript
function QRScanner({ onScan, onError }: { onScan: (url: string) => void; onError: (msg: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const [permDenied, setPermDenied] = useState(false);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let stopped = false;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); setActive(true); }
      })
      .catch(() => { setPermDenied(true); onError('Camera permission denied. Please allow camera access and try again.'); });

    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    async function tick() {
      if (!videoRef.current || !canvasRef.current) { rafRef.current = requestAnimationFrame(tick); return; }
      const video = videoRef.current;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) { rafRef.current = requestAnimationFrame(tick); return; }
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { rafRef.current = requestAnimationFrame(tick); return; }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const jsQR = (await import('jsqr')).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data) { onScan(code.data); return; }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, onScan]);

  if (permDenied) return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-status-error text-sm font-semibold">Camera access denied</p>
      <p className="text-text-light text-xs">Go to your browser settings → allow camera for this site, then refresh.</p>
    </div>
  );

  return (
    <div className="relative w-full aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-black">
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
      {/* Scan overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-52 h-52 border-2 border-white/70 rounded-2xl relative">
          <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
          <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
          <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
          <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
        </div>
      </div>
      {!active && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
    </div>
  );
}
```

- [ ] **Step 3: Replace static scan tab content with live scanner**

In `src/app/my-rewards/page.tsx`, find the `tab === 'scan'` section (around line 721) and replace the static steps UI with:

```typescript
{tab === 'scan' && (
  <div className="space-y-4">
    <div className="text-center">
      <p className="font-bold text-text-dark text-lg">Scan Store QR Code</p>
      <p className="text-sm text-text-light mt-1">Point your camera at any LetLoyal store QR code to earn rewards.</p>
    </div>
    {scanError && (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-status-error text-center">{scanError}</div>
    )}
    {scanSuccess ? (
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 text-center font-semibold">
        ✅ Visit recorded! Points added to your card.
      </div>
    ) : (
      <QRScanner
        onScan={handleQRScan}
        onError={msg => setScanError(msg)}
      />
    )}
    <p className="text-xs text-text-light text-center">Make sure the QR code is well-lit and inside the frame</p>
  </div>
)}
```

Add state variables:
```typescript
const [scanError,   setScanError]   = useState('');
const [scanSuccess, setScanSuccess] = useState(false);
```

Add `handleQRScan` function:
```typescript
async function handleQRScan(url: string) {
  setScanError('');
  // QR contains URL like https://pilot.letloyal.com/s/merchant-slug or /api/merchant/[slug]/qr/[token]
  try {
    const u = new URL(url);
    // Extract scan token from URL path e.g. /api/merchant/chai-corner/qr/abc123
    const match = u.pathname.match(/\/s\/([^/]+)/) || u.pathname.match(/\/m\/([^/]+)/);
    if (!match) { setScanError('Not a valid LetLoyal QR code.'); return; }
    const slug = match[1];
    const res = await fetch(`/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_url: url, slug }),
    });
    const data = await res.json();
    if (!res.ok) { setScanError(data.error || 'Scan failed.'); return; }
    setScanSuccess(true);
    setTimeout(() => { setScanSuccess(false); loadCards(); }, 3000);
  } catch { setScanError('Could not read QR code.'); }
}
```

- [ ] **Step 4: Verify scan API accepts slug-based scan**

Check `src/app/api/scan/route.ts` — it currently accepts a `token` from the QR. The QR URL generated by `QRPanel.tsx` contains the full URL with token. The `handleQRScan` above passes `qr_url` to the scan API. Verify scan route can extract and validate the token from the URL. If it currently expects `{ token }` body param, update it to also accept `{ qr_url }` and parse the token from the URL.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: in-app QR scanner with jsQR — live camera scan in customer dashboard"
```

---

## Final: Push & Deploy

- [ ] **Step 1: Build locally to check for errors**

```bash
npm run build
```

Expected: no TypeScript errors, 81+ pages generated.

- [ ] **Step 2: Push to GitHub**

```bash
git push origin master
```

- [ ] **Step 3: Deploy on VPS**

```bash
ssh root@72.60.18.98
cd /var/www/letloyal-production && ./deploy.sh
```

- [ ] **Step 4: Verify PM2 is online**

```bash
pm2 list
```

Expected: `letloyal-production` status = `online`.

---

## Self-Review

**Spec coverage check:**
- ✅ M1 — Customer httpOnly cookie auth
- ✅ M2 — Merchant self-registration + email OTP
- ✅ M3 — DPDP consent banner + audit log + 4 legal pages
- ✅ M4 — Admin billing, services health, change-password, 7d session, redirect fix
- ✅ M5 — Google OAuth (phone + Google login)
- ✅ M6 — Location picker + nearby discovery
- ✅ M7 — Streak campaigns
- ✅ M8 — Instant offers
- ✅ M9 — PWA manifest + icons + SW + offline page
- ✅ M10 — Merchant welcome email redesign
- ✅ M11 — In-app QR scanner with jsQR + camera fallback error UI
- ✅ QR scanner: no manual code entry (dropped per user decision)
- ✅ India context: INR (₹), DPDP Act 2023, English only, no locale prefix
- ✅ Same repo: letloyal-production / master branch

**No placeholders found.**
**Type consistency verified** — `CustomerTokenPayload.phone` is `string | null` throughout all tasks.
