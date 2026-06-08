# Customer Auth, Profile & Merchant Analytics — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email+phone+password auth for customers, full editable profile, and a merchant analytics page with gender/age/birthday breakdowns.

**Architecture:** Customer auth uses server-verified JWTs stored in localStorage (Bearer token pattern). DB gains 4 new columns on `customers` + a `customer_reset_tokens` table. Merchant analytics is a new server-rendered page at `/m/[slug]/analytics` powered by a new API route that aggregates customer demographic data without exposing raw PII.

**Tech Stack:** Next.js 15, TypeScript, MySQL2, bcryptjs (already installed), jsonwebtoken (already installed), nodemailer (already installed), Tailwind CSS v3.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/utils.ts` | Create | Shared `maskPhone()`, `normalizePhone()` helpers |
| `src/lib/customerAuth.ts` | Create | Customer JWT sign/verify, localStorage token key |
| `src/lib/customerSession.ts` | Modify | Add `token` field to session, store/retrieve JWT |
| `src/app/api/customer/auth/register/route.ts` | Create | POST register — hash password, create customer, return JWT |
| `src/app/api/customer/auth/login/route.ts` | Create | POST login — verify password, return JWT + profile |
| `src/app/api/customer/auth/forgot/route.ts` | Create | POST forgot — email lookup, send reset link |
| `src/app/api/customer/auth/reset/route.ts` | Create | POST reset — consume token, set new password |
| `src/app/customer/reset-password/page.tsx` | Create | Client page — reads ?token from URL, shows new-password form |
| `src/app/api/customer/profile/route.ts` | Create | GET own profile, PUT update name/email/phone/birthday/gender |
| `src/app/api/customer/profile/password/route.ts` | Create | PUT change password (requires current password) |
| `src/app/my-rewards/page.tsx` | Modify | Login/register toggle, account tab with inline profile editing |
| `src/components/customer/ScanClient.tsx` | Modify | Auto-submit uses token from session; save token after scan |
| `src/app/m/[slug]/page.tsx` | Modify | Import maskPhone from utils.ts |
| `src/app/m/[slug]/validate/page.tsx` | Modify | Import maskPhone from utils.ts |
| `src/app/api/merchant/[slug]/analytics/route.ts` | Create | GET gender stats, age groups, upcoming birthdays |
| `src/app/m/[slug]/analytics/page.tsx` | Create | Analytics page — bar charts + birthday list |
| `src/components/merchant/DashboardShell.tsx` | Modify | Add Analytics nav item |

---

## Task 1: DB Migration

**Files:**
- Modify: VPS MySQL `letloyal_prod` database (SSH)
- Modify: `src/app/api/customer/auth/register/route.ts` (referenced in later tasks)

- [ ] **Step 1: Run migration on VPS**

SSH in and run:

```bash
ssh root@72.60.18.98
```

Then execute:

```sql
mysql -u letloyal_user -pLlPilot#2026 letloyal_prod << 'EOF'
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS email         VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS birthday      DATE         NULL,
  ADD COLUMN IF NOT EXISTS gender        ENUM('male','female','other','prefer_not_to_say') NULL;

-- Add unique index only if it doesn't exist
SET @idx_exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = 'letloyal_prod'
    AND table_name = 'customers'
    AND index_name = 'idx_customers_email'
);
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE customers ADD UNIQUE KEY idx_customers_email (email)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS customer_reset_tokens (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  customer_id  VARCHAR(36)  NOT NULL,
  token_hash   VARCHAR(255) NOT NULL,
  expires_at   TIMESTAMP    NOT NULL,
  used_at      TIMESTAMP    NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_crt_token (token_hash),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF
```

- [ ] **Step 2: Verify migration**

```bash
mysql -u letloyal_user -pLlPilot#2026 letloyal_prod -e "DESCRIBE customers; SHOW TABLES LIKE 'customer_reset_tokens';"
```

Expected: customers table shows `password_hash`, `email`, `birthday`, `gender` columns. `customer_reset_tokens` table listed.

- [ ] **Step 3: Add CUSTOMER_JWT_SECRET to VPS .env.local**

```bash
# On VPS, in /var/www/letloyal-production:
echo 'CUSTOMER_JWT_SECRET=ll_cust_7f3k9m2p5r8t1v4w6x0y3z1a4b7c0d3e6f9g2h5i8j1k4l7m0n3p6q9r2s5t8u1v4w7x0y3z6' >> /var/www/letloyal-production/.env.local
echo 'NEXT_PUBLIC_BASE_URL=https://pilot.letloyal.com' >> /var/www/letloyal-production/.env.local
```

- [ ] **Step 4: Add to local .env.local**

Append to `C:/Users/jaiso/OneDrive/Desktop/Letloyal/letloyal-production/.env.local`:

```
CUSTOMER_JWT_SECRET=ll_cust_7f3k9m2p5r8t1v4w6x0y3z1a4b7c0d3e6f9g2h5i8j1k4l7m0n3p6q9r2s5t8u1v4w7x0y3z6
NEXT_PUBLIC_BASE_URL=https://pilot.letloyal.com
```

---

## Task 2: Shared Utilities

**Files:**
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create utils.ts**

```typescript
// src/lib/utils.ts
// Shared pure helpers — no DB, no network, safe in any runtime

/**
 * Mask a phone number for merchant-facing display.
 * "+919876543210" or "9876543210" → "98••••210"
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^91/, '');
  if (digits.length < 7) return '••••••';
  return `${digits.slice(0, 2)}••••${digits.slice(-3)}`;
}

/**
 * Normalize phone to E.164 +91XXXXXXXXXX format.
 * Accepts "9876543210", "09876543210", "919876543210", "+919876543210"
 * Returns null if invalid.
 */
export function normalizePhone(raw: string): string | null {
  const digits = String(raw).replace(/\D/g, '').replace(/^(91|0)/, '');
  if (digits.length !== 10) return null;
  return `+91${digits}`;
}

/**
 * Strip +91 prefix and return 10-digit string for display.
 */
export function displayPhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^91/, '');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat: add shared utils — maskPhone, normalizePhone, displayPhone"
```

---

## Task 3: Customer JWT Helpers

**Files:**
- Create: `src/lib/customerAuth.ts`
- Modify: `src/lib/customerSession.ts`

- [ ] **Step 1: Create customerAuth.ts**

```typescript
// src/lib/customerAuth.ts
// Customer JWT helpers — Bearer token stored in localStorage (not cookies).
// Uses a separate secret from the merchant JWT.

import jwt from 'jsonwebtoken';

const SECRET  = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET || 'dev_cust_secret';
const EXPIRY  = '7d';
export const TOKEN_KEY = 'll_customer_token'; // localStorage key

export interface CustomerTokenPayload {
  sub:   string;  // customer id
  type:  'customer';
  phone: string;  // +91XXXXXXXXXX
}

export function signCustomerToken(payload: Omit<CustomerTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'customer' }, SECRET, { expiresIn: EXPIRY } as jwt.SignOptions);
}

export function verifyCustomerToken(token: string): CustomerTokenPayload | null {
  try {
    const p = jwt.verify(token, SECRET) as CustomerTokenPayload;
    if (p.type !== 'customer') return null;
    return p;
  } catch {
    return null;
  }
}

/**
 * Extract and verify Bearer token from Authorization header.
 * Returns payload or null.
 */
export function getCustomerFromRequest(req: Request): CustomerTokenPayload | null {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  return verifyCustomerToken(token);
}

/**
 * Guard for customer-authenticated API routes.
 * Throws a Response(401) if not authenticated.
 */
export function requireCustomer(req: Request): CustomerTokenPayload {
  const payload = getCustomerFromRequest(req);
  if (!payload) {
    throw new Response(JSON.stringify({ error: 'Not authenticated.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return payload;
}
```

- [ ] **Step 2: Update customerSession.ts — add token field**

Replace the entire file:

```typescript
// src/lib/customerSession.ts
// Client-side only — customer session persistence via localStorage
// 30-day inactivity → auto logout

import { TOKEN_KEY } from '@/lib/customerAuth';

const KEY = 'll_customer';
const INACTIVITY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface CustomerSession {
  phone:      string;       // 10 digits, no country code
  name:       string | null;
  lastActive: number;       // epoch ms
}

export function getCustomerSession(): CustomerSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s: CustomerSession = JSON.parse(raw);
    if (Date.now() - s.lastActive > INACTIVITY_MS) {
      localStorage.removeItem(KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function saveCustomerSession(phone: string, name: string | null, token?: string) {
  if (typeof window === 'undefined') return;
  const s: CustomerSession = { phone, name, lastActive: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(s));
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function touchCustomerSession() {
  if (typeof window === 'undefined') return;
  const s = getCustomerSession();
  if (s) {
    const s2: CustomerSession = { ...s, lastActive: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(s2));
  }
}

export function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearCustomerSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(TOKEN_KEY);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/customerAuth.ts src/lib/customerSession.ts
git commit -m "feat: customer JWT helpers + updated session with token storage"
```

---

## Task 4: Customer Register & Login APIs

**Files:**
- Create: `src/app/api/customer/auth/register/route.ts`
- Create: `src/app/api/customer/auth/login/route.ts`

- [ ] **Step 1: Create register route**

```typescript
// src/app/api/customer/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { signCustomerToken } from '@/lib/customerAuth';
import { query, queryOne } from '@/lib/db';
import { normalizePhone } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone_number, password } = await req.json();

    // ── Validate ──────────────────────────────────────────────────────
    if (!name?.trim())    return NextResponse.json({ error: 'Name is required.' },     { status: 400 });
    if (!email?.trim())   return NextResponse.json({ error: 'Email is required.' },    { status: 400 });
    if (!phone_number)    return NextResponse.json({ error: 'Phone is required.' },    { status: 400 });
    if (!password)        return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const normPhone = normalizePhone(phone_number);
    if (!normPhone) return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });

    const normEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    // ── Check duplicates ──────────────────────────────────────────────
    const existingPhone = await queryOne<{ id: string }>(
      'SELECT id FROM customers WHERE phone_number = ?', [normPhone]
    );
    if (existingPhone) return NextResponse.json({ error: 'An account with this phone number already exists.' }, { status: 409 });

    const existingEmail = await queryOne<{ id: string }>(
      'SELECT id FROM customers WHERE email = ?', [normEmail]
    );
    if (existingEmail) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });

    // ── Create customer ───────────────────────────────────────────────
    const password_hash = await hashPassword(password);
    await query(
      `INSERT INTO customers (phone_number, name, email, password_hash)
       VALUES (?, ?, ?, ?)`,
      [normPhone, name.trim(), normEmail, password_hash]
    );

    const customer = await queryOne<{ id: string; name: string }>(
      'SELECT id, name FROM customers WHERE phone_number = ?', [normPhone]
    );
    if (!customer) return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });

    const token = signCustomerToken({ sub: customer.id, phone: normPhone });
    const digits = normPhone.replace('+91', '');

    return NextResponse.json({
      ok: true,
      token,
      customer: { id: customer.id, name: customer.name, phone: digits, email: normEmail },
    });
  } catch (err) {
    console.error('[POST /api/customer/auth/register]', err);
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create login route**

```typescript
// src/app/api/customer/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { comparePassword } from '@/lib/auth';
import { signCustomerToken } from '@/lib/customerAuth';
import { queryOne } from '@/lib/db';
import { normalizePhone } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { phone_number, password } = await req.json();

    if (!phone_number) return NextResponse.json({ error: 'Phone is required.' }, { status: 400 });
    if (!password)     return NextResponse.json({ error: 'Password is required.' }, { status: 400 });

    const normPhone = normalizePhone(phone_number);
    if (!normPhone) return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });

    const customer = await queryOne<{
      id: string; name: string | null; email: string | null;
      password_hash: string | null; birthday: string | null; gender: string | null;
    }>(
      'SELECT id, name, email, password_hash, birthday, gender FROM customers WHERE phone_number = ?',
      [normPhone]
    );

    if (!customer) {
      return NextResponse.json({ error: 'No account found with this phone number.' }, { status: 401 });
    }

    // ── Existing phone-only account (no password set yet) ─────────────
    if (!customer.password_hash) {
      return NextResponse.json({
        error: 'PASSWORD_NOT_SET',
        message: 'This account was created by scanning a QR code. Please set a password to continue.',
      }, { status: 401 });
    }

    const valid = await comparePassword(password, customer.password_hash);
    if (!valid) return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });

    const token  = signCustomerToken({ sub: customer.id, phone: normPhone });
    const digits = normPhone.replace('+91', '');

    return NextResponse.json({
      ok: true,
      token,
      customer: {
        id:       customer.id,
        name:     customer.name,
        phone:    digits,
        email:    customer.email,
        birthday: customer.birthday,
        gender:   customer.gender,
      },
    });
  } catch (err) {
    console.error('[POST /api/customer/auth/login]', err);
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/customer/auth/register/route.ts src/app/api/customer/auth/login/route.ts
git commit -m "feat: customer register + login APIs"
```

---

## Task 5: Forgot Password + Reset APIs + Reset Page

**Files:**
- Create: `src/app/api/customer/auth/forgot/route.ts`
- Create: `src/app/api/customer/auth/reset/route.ts`
- Create: `src/app/customer/reset-password/page.tsx`

- [ ] **Step 1: Create forgot route**

```typescript
// src/app/api/customer/auth/forgot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { sendMail } from '@/lib/mail';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    const normEmail = email.trim().toLowerCase();

    // Always respond with success to prevent email enumeration
    const customer = await queryOne<{ id: string; name: string | null }>(
      'SELECT id, name FROM customers WHERE email = ?', [normEmail]
    );

    if (customer) {
      // Generate raw token (32 bytes) → hash for DB storage
      const rawToken   = crypto.randomBytes(32).toString('hex');
      const tokenHash  = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt  = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Invalidate existing tokens for this customer
      await query(
        'DELETE FROM customer_reset_tokens WHERE customer_id = ?',
        [customer.id]
      );
      await query(
        `INSERT INTO customer_reset_tokens (customer_id, token_hash, expires_at)
         VALUES (?, ?, ?)`,
        [customer.id, tokenHash, expiresAt]
      );

      const base     = process.env.NEXT_PUBLIC_BASE_URL || 'https://pilot.letloyal.com';
      const resetUrl = `${base}/customer/reset-password?token=${rawToken}`;
      const name     = customer.name?.split(' ')[0] ?? 'there';

      await sendMail({
        to:      normEmail,
        subject: 'Reset your LetLoyal password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="color:#0d9488;">Reset your password</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your LetLoyal account password.</p>
            <a href="${resetUrl}"
               style="display:inline-block;background:#0d9488;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0;">
              Reset Password
            </a>
            <p style="color:#6b7280;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true, message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (err) {
    console.error('[POST /api/customer/auth/forgot]', err);
    return NextResponse.json({ error: 'Failed to send reset email.' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create reset route**

```typescript
// src/app/api/customer/auth/reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { signCustomerToken } from '@/lib/customerAuth';
import { queryOne, query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token)    return NextResponse.json({ error: 'Token is required.' },    { status: 400 });
    if (!password) return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const record = await queryOne<{ id: string; customer_id: string; expires_at: string; used_at: string | null }>(
      `SELECT id, customer_id, expires_at, used_at
       FROM customer_reset_tokens
       WHERE token_hash = ?`,
      [tokenHash]
    );

    if (!record)          return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
    if (record.used_at)   return NextResponse.json({ error: 'This reset link has already been used.' }, { status: 400 });
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const password_hash = await hashPassword(password);

    // Mark token used + update password
    await query('UPDATE customer_reset_tokens SET used_at = NOW() WHERE id = ?', [record.id]);
    await query('UPDATE customers SET password_hash = ? WHERE id = ?', [password_hash, record.customer_id]);

    // Auto-login: issue new token
    const customer = await queryOne<{ id: string; name: string | null; phone_number: string; email: string | null }>(
      'SELECT id, name, phone_number, email FROM customers WHERE id = ?',
      [record.customer_id]
    );
    if (!customer) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

    const jwtToken = signCustomerToken({ sub: customer.id, phone: customer.phone_number });
    const digits   = customer.phone_number.replace('+91', '');

    return NextResponse.json({
      ok: true,
      token: jwtToken,
      customer: { id: customer.id, name: customer.name, phone: digits, email: customer.email },
    });
  } catch (err) {
    console.error('[POST /api/customer/auth/reset]', err);
    return NextResponse.json({ error: 'Password reset failed.' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create reset-password page**

```typescript
// src/app/customer/reset-password/page.tsx
'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { saveCustomerSession } from '@/lib/customerSession';

function ResetForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [done,       setDone]       = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid reset link. Please request a new one.');
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/customer/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed.'); return; }
      // Auto-login
      saveCustomerSession(data.customer.phone, data.customer.name, data.token);
      setDone(true);
      setTimeout(() => router.push('/my-rewards'), 2000);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto">
          <span className="text-3xl">✓</span>
        </div>
        <p className="font-bold text-text-dark text-xl">Password updated!</p>
        <p className="text-text-medium text-sm">Taking you to your rewards…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="form-label">New Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="form-input pl-9 pr-10"
            required
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div>
        <label className="form-label">Confirm Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
          <input
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password"
            className="form-input pl-9"
            required
          />
        </div>
      </div>
      {error && <p className="text-sm text-status-error">{error}</p>}
      <button type="submit" disabled={loading || !token}
        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
        {loading ? 'Updating…' : 'Set New Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-bg-muted flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-dark">Set new password</h1>
          <p className="text-text-medium text-sm mt-1">Choose a strong password for your account</p>
        </div>
        <div className="bg-white rounded-2xl border border-border-light p-5">
          <Suspense fallback={<div className="py-8 text-center text-text-light text-sm">Loading…</div>}>
            <ResetForm />
          </Suspense>
        </div>
        <p className="text-center text-xs text-text-light">Powered by LetLoyal</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/customer/auth/forgot/route.ts \
        src/app/api/customer/auth/reset/route.ts \
        src/app/customer/reset-password/page.tsx
git commit -m "feat: forgot password + reset APIs + reset password page"
```

---

## Task 6: Customer Profile APIs

**Files:**
- Create: `src/app/api/customer/profile/route.ts`
- Create: `src/app/api/customer/profile/password/route.ts`

- [ ] **Step 1: Create profile GET + PUT route**

```typescript
// src/app/api/customer/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/customerAuth';
import { comparePassword, hashPassword } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { normalizePhone } from '@/lib/utils';

// GET /api/customer/profile — return own profile
export async function GET(req: NextRequest) {
  try {
    const auth = requireCustomer(req);
    const customer = await queryOne<{
      id: string; name: string | null; phone_number: string;
      email: string | null; birthday: string | null; gender: string | null;
    }>(
      'SELECT id, name, phone_number, email, birthday, gender FROM customers WHERE id = ?',
      [auth.sub]
    );
    if (!customer) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const digits = customer.phone_number.replace('+91', '');
    return NextResponse.json({ ok: true, customer: { ...customer, phone: digits } });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[GET /api/customer/profile]', err);
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}

// PUT /api/customer/profile — update name/email/phone/birthday/gender
export async function PUT(req: NextRequest) {
  try {
    const auth = requireCustomer(req);
    const { name, email, phone_number, birthday, gender, current_password } = await req.json();

    const updates: string[] = [];
    const values:  unknown[] = [];

    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
      updates.push('name = ?'); values.push(name.trim());
    }

    if (email !== undefined) {
      const normEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
        return NextResponse.json({ error: 'Invalid email.' }, { status: 400 });
      }
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM customers WHERE email = ? AND id != ?', [normEmail, auth.sub]
      );
      if (existing) return NextResponse.json({ error: 'Email already in use.' }, { status: 409 });
      updates.push('email = ?'); values.push(normEmail);
    }

    if (phone_number !== undefined) {
      // Phone change requires current password
      if (!current_password) {
        return NextResponse.json({ error: 'Current password required to change phone number.' }, { status: 400 });
      }
      const customer = await queryOne<{ password_hash: string | null }>(
        'SELECT password_hash FROM customers WHERE id = ?', [auth.sub]
      );
      if (!customer?.password_hash) {
        return NextResponse.json({ error: 'Set a password before changing phone number.' }, { status: 400 });
      }
      const valid = await comparePassword(current_password, customer.password_hash);
      if (!valid) return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });

      const normPhone = normalizePhone(phone_number);
      if (!normPhone) return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });

      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM customers WHERE phone_number = ? AND id != ?', [normPhone, auth.sub]
      );
      if (existing) return NextResponse.json({ error: 'Phone number already in use.' }, { status: 409 });
      updates.push('phone_number = ?'); values.push(normPhone);
    }

    if (birthday !== undefined) {
      updates.push('birthday = ?');
      values.push(birthday === '' ? null : birthday); // 'YYYY-MM-DD' or null to clear
    }

    if (gender !== undefined) {
      const allowed = ['male', 'female', 'other', 'prefer_not_to_say', ''];
      if (!allowed.includes(gender)) {
        return NextResponse.json({ error: 'Invalid gender value.' }, { status: 400 });
      }
      updates.push('gender = ?');
      values.push(gender === '' ? null : gender);
    }

    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });

    values.push(auth.sub);
    await query(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[PUT /api/customer/profile]', err);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create password change route**

```typescript
// src/app/api/customer/profile/password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/customerAuth';
import { comparePassword, hashPassword } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const auth = requireCustomer(req);
    const { current_password, new_password } = await req.json();

    if (!current_password) return NextResponse.json({ error: 'Current password is required.' }, { status: 400 });
    if (!new_password)     return NextResponse.json({ error: 'New password is required.' },     { status: 400 });
    if (new_password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const customer = await queryOne<{ password_hash: string | null }>(
      'SELECT password_hash FROM customers WHERE id = ?', [auth.sub]
    );
    if (!customer) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

    if (customer.password_hash) {
      const valid = await comparePassword(current_password, customer.password_hash);
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    const new_hash = await hashPassword(new_password);
    await query('UPDATE customers SET password_hash = ? WHERE id = ?', [new_hash, auth.sub]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[PUT /api/customer/profile/password]', err);
    return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/customer/profile/route.ts src/app/api/customer/profile/password/route.ts
git commit -m "feat: customer profile GET/PUT + change password API"
```

---

## Task 7: Phone Masking — Merchant Pages

**Files:**
- Modify: `src/app/m/[slug]/page.tsx`
- Modify: `src/app/m/[slug]/validate/page.tsx`
- Modify: `src/app/api/merchant/[slug]/dashboard/route.ts` (if it exists and returns phone)

- [ ] **Step 1: Update dashboard page to use shared maskPhone**

In `src/app/m/[slug]/page.tsx`, remove the local `maskPhone` function and replace with import:

```typescript
// Remove this from the file:
// function maskPhone(phone: string) {
//   if (phone.length >= 10) return `${phone.slice(0, 3)}••••${phone.slice(-3)}`;
//   return phone;
// }

// Add to imports at top:
import { maskPhone } from '@/lib/utils';
```

- [ ] **Step 2: Update validate page**

In `src/app/m/[slug]/validate/page.tsx`, find anywhere `phone` or `phone_number` is displayed and wrap with `maskPhone()`. Add import:

```typescript
import { maskPhone } from '@/lib/utils';
```

Then wherever customer phone is rendered (e.g. in the step-1 result display), wrap:
```typescript
// Before: {phone}
// After:  {maskPhone(phone)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/m/[slug]/page.tsx src/app/m/[slug]/validate/page.tsx
git commit -m "fix: use shared maskPhone from utils across merchant pages"
```

---

## Task 8: Merchant Analytics API

**Files:**
- Create: `src/app/api/merchant/[slug]/analytics/route.ts`

- [ ] **Step 1: Create analytics API**

```typescript
// src/app/api/merchant/[slug]/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { maskPhone } from '@/lib/utils';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    requireMerchant(req, slug);

    const merchant = await queryOne<{ id: string }>(
      'SELECT id FROM merchants WHERE slug = ?', [slug]
    );
    if (!merchant) return NextResponse.json({ error: 'Merchant not found.' }, { status: 404 });

    const merchantId = merchant.id;

    // ── Gender stats ───────────────────────────────────────────────────
    const genderRows = await query<{ gender: string | null; cnt: number }>(`
      SELECT cu.gender, COUNT(*) AS cnt
      FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ?
      GROUP BY cu.gender
    `, [merchantId]);

    const genderMap: Record<string, number> = { male: 0, female: 0, other: 0, not_shared: 0 };
    let totalGender = 0;
    for (const row of genderRows) {
      const key = row.gender ?? 'not_shared';
      genderMap[key] = (genderMap[key] ?? 0) + Number(row.cnt);
      totalGender += Number(row.cnt);
    }
    const gender_stats = Object.entries(genderMap).map(([label, count]) => ({
      label,
      count,
      pct: totalGender > 0 ? Math.round((count / totalGender) * 100) : 0,
    }));

    // ── Age groups ─────────────────────────────────────────────────────
    const ageRows = await query<{ age_group: string; cnt: number }>(`
      SELECT
        CASE
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) < 18 THEN 'under_18'
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) BETWEEN 18 AND 24 THEN '18-24'
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) BETWEEN 25 AND 34 THEN '25-34'
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) BETWEEN 35 AND 44 THEN '35-44'
          ELSE '45+'
        END AS age_group,
        COUNT(*) AS cnt
      FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ?
        AND cu.birthday IS NOT NULL
      GROUP BY age_group
    `, [merchantId]);

    const ageOrder = ['under_18', '18-24', '25-34', '35-44', '45+'];
    const ageMap: Record<string, number> = {};
    let totalAge = 0;
    for (const row of ageRows) {
      ageMap[row.age_group] = Number(row.cnt);
      totalAge += Number(row.cnt);
    }
    const age_groups = ageOrder
      .filter(g => (ageMap[g] ?? 0) > 0)
      .map(g => ({
        label: g,
        count: ageMap[g] ?? 0,
        pct:   totalAge > 0 ? Math.round(((ageMap[g] ?? 0) / totalAge) * 100) : 0,
      }));

    const noAgeCount = await queryOne<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ? AND cu.birthday IS NULL
    `, [merchantId]);

    // ── Upcoming birthdays (next 30 days) ─────────────────────────────
    const birthdayRows = await query<{
      name: string | null; phone_number: string; days_until: number;
    }>(`
      SELECT
        cu.name,
        cu.phone_number,
        DATEDIFF(
          DATE(CONCAT(
            IF(
              DATE_FORMAT(CURDATE(), '%m-%d') <= DATE_FORMAT(cu.birthday, '%m-%d'),
              YEAR(CURDATE()),
              YEAR(CURDATE()) + 1
            ),
            '-',
            DATE_FORMAT(cu.birthday, '%m-%d')
          )),
          CURDATE()
        ) AS days_until
      FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ?
        AND cu.birthday IS NOT NULL
      HAVING days_until BETWEEN 0 AND 30
      ORDER BY days_until ASC
    `, [merchantId]);

    const upcoming_birthdays = birthdayRows.map(r => ({
      display_name:  r.name ? r.name.split(' ')[0] : 'Customer',
      masked_phone:  maskPhone(r.phone_number),
      days_until:    Number(r.days_until),
      days_label:    Number(r.days_until) === 0 ? 'Today! 🎂'
                   : Number(r.days_until) === 1 ? 'Tomorrow'
                   : `In ${r.days_until} days`,
    }));

    return NextResponse.json({
      ok: true,
      gender_stats,
      age_groups,
      age_not_shared: noAgeCount?.cnt ?? 0,
      upcoming_birthdays,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[GET /api/merchant/[slug]/analytics]', err);
    return NextResponse.json({ error: 'Failed to load analytics.' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/merchant/[slug]/analytics/route.ts
git commit -m "feat: merchant analytics API — gender, age groups, upcoming birthdays"
```

---

## Task 9: Merchant Analytics Page

**Files:**
- Create: `src/app/m/[slug]/analytics/page.tsx`
- Modify: `src/components/merchant/DashboardShell.tsx`

- [ ] **Step 1: Create analytics page**

```typescript
// src/app/m/[slug]/analytics/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMerchantFromCookies } from '@/lib/session';
import { query, queryOne } from '@/lib/db';
import { maskPhone } from '@/lib/utils';
import { Users, Gift, TrendingUp, BarChart2 } from 'lucide-react';

type PageProps = { params: Promise<{ slug: string }> };

interface GenderStat  { label: string; count: number; pct: number; }
interface AgeGroup    { label: string; count: number; pct: number; }
interface UpcomingBirthday { display_name: string; masked_phone: string; days_until: number; days_label: string; }

// ── Bar row component ───────────────────────────────────────────────────────
function BarRow({ label, pct, count, color }: { label: string; pct: number; count: number; color: string }) {
  const displayLabel: Record<string, string> = {
    male: 'Male', female: 'Female', other: 'Other',
    not_shared: 'Not shared', prefer_not_to_say: 'Prefer not to say',
    under_18: 'Under 18', '18-24': '18–24', '25-34': '25–34',
    '35-44': '35–44', '45+': '45+',
  };
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-text-dark">{displayLabel[label] ?? label}</span>
        <span className="text-sm font-bold text-text-dark">{pct}% <span className="text-xs text-text-light font-normal">({count})</span></span>
      </div>
      <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── WhatsApp dummy button ────────────────────────────────────────────────────
function WhatsAppButton() {
  return (
    <button
      onClick={() => alert('WhatsApp & push notifications are not available in this plan.\nContact support to upgrade.')}
      className="flex-shrink-0 bg-[#25D366] hover:bg-[#1fba59] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
    >
      📲 WhatsApp
    </button>
  );
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { slug } = await params;
  await cookies();
  const merchant = await getMerchantFromCookies();
  if (!merchant || merchant.slug !== slug) redirect('/merchant/login');

  const merchantId = merchant.id;

  // ── Fetch all analytics data ─────────────────────────────────────────
  const [genderRows, ageRows, birthdayRows, noAgeRow, totalCustomers] = await Promise.all([

    query<{ gender: string | null; cnt: number }>(`
      SELECT cu.gender, COUNT(*) AS cnt
      FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ?
      GROUP BY cu.gender
    `, [merchantId]),

    query<{ age_group: string; cnt: number }>(`
      SELECT
        CASE
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) < 18 THEN 'under_18'
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) BETWEEN 18 AND 24 THEN '18-24'
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) BETWEEN 25 AND 34 THEN '25-34'
          WHEN YEAR(CURDATE()) - YEAR(cu.birthday) BETWEEN 35 AND 44 THEN '35-44'
          ELSE '45+'
        END AS age_group,
        COUNT(*) AS cnt
      FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ? AND cu.birthday IS NOT NULL
      GROUP BY age_group
    `, [merchantId]),

    query<{ name: string | null; phone_number: string; days_until: number }>(`
      SELECT cu.name, cu.phone_number,
        DATEDIFF(
          DATE(CONCAT(
            IF(DATE_FORMAT(CURDATE(),'%m-%d') <= DATE_FORMAT(cu.birthday,'%m-%d'),
               YEAR(CURDATE()), YEAR(CURDATE()) + 1),
            '-', DATE_FORMAT(cu.birthday,'%m-%d')
          )),
          CURDATE()
        ) AS days_until
      FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ? AND cu.birthday IS NOT NULL
      HAVING days_until BETWEEN 0 AND 30
      ORDER BY days_until ASC
    `, [merchantId]),

    queryOne<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt FROM customer_merchant cm
      JOIN customers cu ON cu.id = cm.customer_id
      WHERE cm.merchant_id = ? AND cu.birthday IS NULL
    `, [merchantId]),

    queryOne<{ cnt: number }>(
      'SELECT COUNT(DISTINCT customer_id) AS cnt FROM customer_merchant WHERE merchant_id = ?',
      [merchantId]
    ),
  ]);

  // ── Process gender ───────────────────────────────────────────────────
  const genderMap: Record<string, number> = { male: 0, female: 0, other: 0, prefer_not_to_say: 0, not_shared: 0 };
  let totalGender = 0;
  for (const row of genderRows) {
    const key = row.gender ?? 'not_shared';
    genderMap[key] = (genderMap[key] ?? 0) + Number(row.cnt);
    totalGender += Number(row.cnt);
  }
  const genderStats: GenderStat[] = Object.entries(genderMap)
    .filter(([, c]) => c > 0)
    .map(([label, count]) => ({ label, count, pct: totalGender > 0 ? Math.round((count / totalGender) * 100) : 0 }));

  // ── Process age groups ───────────────────────────────────────────────
  const ageOrder = ['under_18', '18-24', '25-34', '35-44', '45+'];
  const ageMap: Record<string, number> = {};
  let totalAge = 0;
  for (const row of ageRows) { ageMap[row.age_group] = Number(row.cnt); totalAge += Number(row.cnt); }
  const ageGroups: AgeGroup[] = ageOrder
    .filter(g => (ageMap[g] ?? 0) > 0)
    .map(g => ({ label: g, count: ageMap[g] ?? 0, pct: totalAge > 0 ? Math.round(((ageMap[g] ?? 0) / totalAge) * 100) : 0 }));

  // ── Process birthdays ────────────────────────────────────────────────
  const upcomingBirthdays: UpcomingBirthday[] = birthdayRows.map(r => ({
    display_name: r.name ? r.name.split(' ')[0] : 'Customer',
    masked_phone: maskPhone(r.phone_number),
    days_until:   Number(r.days_until),
    days_label:   Number(r.days_until) === 0 ? 'Today! 🎂'
                : Number(r.days_until) === 1 ? 'Tomorrow'
                : `In ${r.days_until} days`,
  }));

  const genderColors: Record<string, string> = {
    male: 'bg-primary', female: 'bg-purple-400',
    other: 'bg-amber-400', not_shared: 'bg-gray-300', prefer_not_to_say: 'bg-gray-300',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
          <BarChart2 size={24} className="text-primary" /> Customer Analytics
        </h1>
        <p className="text-text-light text-sm mt-1">
          Based on {totalCustomers?.cnt ?? 0} total customers · Only customers who shared their details are included in breakdowns
        </p>
      </div>

      {/* Gender + Age side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Gender */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-primary" />
            <h2 className="font-semibold text-text-dark">Gender Split</h2>
          </div>
          {genderStats.length === 0 ? (
            <p className="text-sm text-text-light py-4 text-center">No gender data yet — customers can add this in their profile.</p>
          ) : (
            <>
              {genderStats.map(s => (
                <BarRow key={s.label} label={s.label} pct={s.pct} count={s.count}
                  color={genderColors[s.label] ?? 'bg-gray-300'} />
              ))}
              <p className="text-xs text-text-light mt-2">Based on {totalGender} customers who shared gender</p>
            </>
          )}
        </div>

        {/* Age */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="font-semibold text-text-dark">Age Groups</h2>
          </div>
          {ageGroups.length === 0 ? (
            <p className="text-sm text-text-light py-4 text-center">No age data yet — customers can add birthday in their profile.</p>
          ) : (
            <>
              {ageGroups.map(g => (
                <BarRow key={g.label} label={g.label} pct={g.pct} count={g.count} color="bg-amber-400" />
              ))}
              <p className="text-xs text-text-light mt-2">
                Based on {totalAge} customers · {noAgeRow?.cnt ?? 0} have not shared birthday
              </p>
            </>
          )}
        </div>
      </div>

      {/* Upcoming Birthdays */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-primary" />
            <h2 className="font-semibold text-text-dark">Upcoming Birthdays</h2>
            <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Next 30 days</span>
          </div>
          {upcomingBirthdays.length > 0 && (
            <span className="text-sm text-text-light">{upcomingBirthdays.length} birthday{upcomingBirthdays.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {upcomingBirthdays.length === 0 ? (
          <p className="text-sm text-text-light py-6 text-center">No upcoming birthdays in the next 30 days.</p>
        ) : (
          <div className="space-y-3">
            {upcomingBirthdays.map((b, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${
                b.days_until <= 1 ? 'bg-amber-50 border-amber-200' : 'bg-surface border-border-light'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                    b.days_until <= 1 ? 'bg-amber-100' : 'bg-primary-light'
                  }`}>🎂</div>
                  <div>
                    <p className="text-sm font-semibold text-text-dark">{b.display_name}</p>
                    <p className="text-xs text-text-light">
                      {b.masked_phone} · <strong className={b.days_until <= 1 ? 'text-amber-700' : 'text-text-medium'}>{b.days_label}</strong>
                    </p>
                  </div>
                </div>
                <WhatsAppButton />
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-primary-light rounded-xl border border-primary/20">
          <p className="text-xs text-primary">
            📌 Only first name and masked phone are shown. Full date of birth is never displayed.
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add Analytics to DashboardShell nav**

In `src/components/merchant/DashboardShell.tsx`, add the Analytics nav item between Customers and Validate:

```typescript
// Add to imports:
import { BarChart2 } from 'lucide-react';

// In the nav array, replace:
// { label: 'Customers',  href: `/m/${slug}/customers`, icon: <Users size={18} /> },
// { label: 'Validate',   href: `/m/${slug}/validate`,  icon: <ShieldCheck size={18} /> },
// With:
{ label: 'Customers',  href: `/m/${slug}/customers`,  icon: <Users      size={18} /> },
{ label: 'Analytics',  href: `/m/${slug}/analytics`,  icon: <BarChart2  size={18} /> },
{ label: 'Validate',   href: `/m/${slug}/validate`,   icon: <ShieldCheck size={18} /> },
```

- [ ] **Step 3: Commit**

```bash
git add src/app/m/[slug]/analytics/page.tsx src/components/merchant/DashboardShell.tsx
git commit -m "feat: merchant analytics page — gender, age groups, upcoming birthdays + Analytics nav item"
```

---

## Task 10: Update `/my-rewards` — Auth + Profile Tab

**Files:**
- Modify: `src/app/my-rewards/page.tsx`

This is a full replacement of the page. The new version adds:
- Login / Register toggle (two states on same screen)
- Forgot password flow inline
- Account tab with inline-editable profile fields
- Password change section
- Token stored to localStorage via `saveCustomerSession`

- [ ] **Step 1: Replace my-rewards/page.tsx**

Replace the entire file with:

```typescript
'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import Image from 'next/image';
import {
  Phone, Mail, User, Lock, Eye, EyeOff, Gift, LogOut, RefreshCw,
  CreditCard, ScanLine, ArrowRight, Copy, Check, MapPin,
  ChevronDown, ChevronUp, Calendar, Venus,
} from 'lucide-react';
import {
  getCustomerSession, saveCustomerSession,
  clearCustomerSession, getCustomerToken,
} from '@/lib/customerSession';

// ── Types ─────────────────────────────────────────────────────────────────────
interface LoyaltyCard {
  merchant_slug: string; business_name: string; logo_url: string | null;
  campaign_name: string; campaign_type: string; progress: number;
  reward_threshold: number; reward_description: string;
  reward_status: 'in_progress' | 'unlocked'; cycle_number: number; last_scan_at: string | null;
}
interface DiscoverStore {
  slug: string; business_name: string; logo_url: string | null;
  campaign_name: string; campaign_type: string; reward_description: string; reward_threshold: number;
}
interface CustomerData {
  id: string; name: string | null; phone: string; email: string | null;
  birthday: string | null; gender: string | null;
}
type Tab = 'cards' | 'scan' | 'account';
type AuthMode = 'login' | 'register' | 'forgot';

// ── Helpers ───────────────────────────────────────────────────────────────────
function Spinner({ sm }: { sm?: boolean }) {
  return (
    <svg className={`animate-spin text-primary ${sm ? 'h-4 w-4' : 'h-8 w-8'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function MerchantAvatar({ logo_url, name, size = 44 }: { logo_url: string | null; name: string; size?: number }) {
  return (
    <div className="rounded-xl overflow-hidden bg-primary-light flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}>
      {logo_url
        ? <Image src={logo_url} alt={name} width={size} height={size} className="object-cover w-full h-full" unoptimized />
        : <span className="font-bold text-primary" style={{ fontSize: size * 0.4 }}>{name[0]}</span>}
    </div>
  );
}

// ── Inline redeem code ────────────────────────────────────────────────────────
function InlineRedeemCode({ phone, slug, onCancel }: { phone: string; slug: string; onCancel: () => void }) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [secs, setSecs] = useState(600);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/public/redeem-code', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phone, slug }),
    })
      .then(r => r.json())
      .then(d => { if (d.code) { setCode(d.code); setSecs((d.expires_minutes ?? 10) * 60); } else setError(d.error || 'Could not generate code.'); })
      .catch(() => setError('Connection error.'))
      .finally(() => setLoading(false));
  }, [phone, slug]);

  useEffect(() => {
    if (!code || secs <= 0) return;
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [code, secs]);

  const m = Math.floor(secs / 60); const s = secs % 60;
  const expired = secs === 0; const urgent = secs < 120 && !expired;

  return (
    <div className="mt-3 rounded-xl bg-primary-light border border-primary/20 p-4 space-y-3">
      <p className="text-xs font-semibold text-primary text-center uppercase tracking-widest">Show this code to the merchant</p>
      {loading ? <div className="flex justify-center py-4"><Spinner /></div>
        : error ? <p className="text-center text-sm text-status-error py-2">{error}</p>
        : code ? (
          <>
            <div className="flex items-center justify-center gap-1.5">
              {code.split('').map((d, i) => (
                <span key={i} className="w-10 flex items-center justify-center text-2xl font-bold text-primary bg-white rounded-xl border-2 border-primary shadow-sm" style={{ height: 52 }}>{d}</span>
              ))}
            </div>
            <div className="flex items-center justify-center">
              <button onClick={() => { navigator.clipboard.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied!' : 'Copy code'}
              </button>
            </div>
            {expired
              ? <p className="text-xs text-center font-semibold text-status-error">Code expired</p>
              : <p className={`text-xs text-center font-semibold tabular-nums ${urgent ? 'text-orange-500' : 'text-text-medium'}`}>Expires in {m}:{String(s).padStart(2, '0')}</p>}
          </>
        ) : null}
      <button onClick={onCancel} className="w-full text-xs text-text-light hover:text-text-medium transition-colors text-center">Cancel Redemption</button>
    </div>
  );
}

// ── Loyalty Card ──────────────────────────────────────────────────────────────
function LoyaltyCardItem({ card, phone }: { card: LoyaltyCard; phone: string }) {
  const [showCode, setShowCode] = useState(false);
  const isUnlocked = card.reward_status === 'unlocked';
  const pct = Math.min(100, Math.round((card.progress / card.reward_threshold) * 100));
  const remaining = Math.max(0, card.reward_threshold - card.progress);
  const isSpend = card.campaign_type === 'spend_based';
  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${isUnlocked ? 'border-primary' : 'border-border-light'}`}>
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <MerchantAvatar logo_url={card.logo_url} name={card.business_name} size={44} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-dark truncate">{card.business_name}</p>
          <p className="text-xs text-text-light">{isSpend ? 'Spend-based' : 'Visit-based'} · {card.campaign_name}</p>
        </div>
        {isUnlocked && <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded-full flex-shrink-0">🎉 Ready!</span>}
      </div>
      <div className="px-4 pb-4">
        <p className="text-sm font-semibold text-text-dark flex items-center gap-1.5 mb-2">
          <Gift size={13} className="text-primary flex-shrink-0" />{card.reward_description}
        </p>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-medium tabular-nums">{card.progress} / {card.reward_threshold} {isSpend ? 'points' : 'visits'}</span>
          {isUnlocked
            ? <span className="text-xs font-semibold text-primary">🎉 Reward ready!</span>
            : <span className="text-xs text-text-light">{remaining} more to go</span>}
        </div>
        <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${isUnlocked ? 'bg-primary' : 'bg-primary/60'}`} style={{ width: `${pct}%` }} />
        </div>
        {isUnlocked && !showCode && (
          <button onClick={() => setShowCode(true)}
            className="mt-3 w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Gift size={16} /> Redeem Now
          </button>
        )}
        {isUnlocked && showCode && <InlineRedeemCode phone={phone} slug={card.merchant_slug} onCancel={() => setShowCode(false)} />}
      </div>
    </div>
  );
}

// ── Discover Store Card ───────────────────────────────────────────────────────
function DiscoverCard({ store }: { store: DiscoverStore }) {
  return (
    <div className="bg-white rounded-2xl border border-border-light shadow-sm p-4 flex items-center gap-3">
      <MerchantAvatar logo_url={store.logo_url} name={store.business_name} size={44} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-dark truncate">{store.business_name}</p>
        <p className="text-xs text-text-light truncate">{store.reward_description}</p>
      </div>
      <span className="text-xs font-semibold text-primary flex items-center gap-0.5 flex-shrink-0">Scan to Join <ArrowRight size={12} /></span>
    </div>
  );
}

// ── Inline editable field ─────────────────────────────────────────────────────
function ProfileField({
  label, value, icon, onSave, type = 'text', options,
}: {
  label: string; value: string | null; icon: React.ReactNode;
  onSave: (val: string) => Promise<void>; type?: string;
  options?: { value: string; label: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSave() {
    setSaving(true); setErr('');
    try { await onSave(input); setEditing(false); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Failed to save.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="px-4 py-3 border-b border-border-light last:border-0">
      {!editing ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-text-light flex-shrink-0">{icon}</span>
            <div className="min-w-0">
              <p className="text-xs text-text-light">{label}</p>
              <p className={`text-sm font-medium truncate ${value ? 'text-text-dark' : 'text-text-light italic'}`}>{value || 'Not set'}</p>
            </div>
          </div>
          <button onClick={() => { setInput(value ?? ''); setEditing(true); }}
            className="text-xs text-primary font-semibold flex-shrink-0 ml-2">{value ? 'Edit' : 'Add'}</button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-dark">{label}</p>
          {options ? (
            <select value={input} onChange={e => setInput(e.target.value)} className="form-input text-sm">
              <option value="">Prefer not to say</option>
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input type={type} value={input} onChange={e => setInput(e.target.value)}
              className="form-input text-sm" />
          )}
          {err && <p className="text-xs text-status-error">{err}</p>}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-primary text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setEditing(false); setErr(''); }}
              className="flex-1 border border-border-light text-xs font-semibold py-2 rounded-lg text-text-medium">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyRewardsPage() {
  const [phase,     setPhase]     = useState<'loading' | 'login' | 'dashboard'>('loading');
  const [authMode,  setAuthMode]  = useState<AuthMode>('login');
  const [phone,     setPhone]     = useState('');
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent]   = useState(false);
  const [customer,  setCustomer]  = useState<CustomerData | null>(null);
  const [cards,     setCards]     = useState<LoyaltyCard[]>([]);
  const [stores,    setStores]    = useState<DiscoverStore[]>([]);
  const [fetching,  setFetching]  = useState(false);
  const [error,     setError]     = useState('');
  const [tab,       setTab]       = useState<Tab>('cards');
  const [pwSection, setPwSection] = useState(false);
  const [curPw,     setCurPw]     = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError,   setPwError]   = useState('');
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwDone,    setPwDone]    = useState(false);

  // ── Auth header for profile API calls ──────────────────────────────────
  function authHeaders(): Record<string, string> {
    const token = getCustomerToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  const loadCards = useCallback(async (phoneDigits: string, cName: string | null = null) => {
    setFetching(true);
    try {
      const [lookupRes, discoverRes] = await Promise.all([
        fetch('/api/customer/lookup', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneDigits }),
        }),
        fetch(`/api/customer/discover?phone=${phoneDigits}`),
      ]);
      const lookupData   = await lookupRes.json();
      const discoverData = await discoverRes.json();
      if (!lookupRes.ok) { setError(lookupData.error || 'Lookup failed.'); setPhase('login'); return; }
      setCustomer(lookupData.customer ?? { name: cName, phone: phoneDigits, email: null, birthday: null, gender: null });
      setCards(lookupData.cards ?? []);
      setStores(discoverData.stores ?? []);
      setPhase('dashboard');
    } catch { setError('Connection error.'); setPhase('login'); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => {
    const session = getCustomerSession();
    if (session) { setPhone(session.phone); loadCards(session.phone, session.name); }
    else setPhase('login');
  }, [loadCards]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault(); setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Enter a valid 10-digit number.'); return; }
    setFetching(true);
    try {
      const res  = await fetch('/api/customer/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: digits, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'PASSWORD_NOT_SET') {
          setError('This account was created by scanning a QR code. Please set a password first — use "Forgot password?" with your email.');
        } else {
          setError(data.error || 'Login failed.');
        }
        return;
      }
      saveCustomerSession(data.customer.phone, data.customer.name, data.token);
      setCustomer(data.customer);
      await loadCards(data.customer.phone, data.customer.name);
    } catch { setError('Connection error.'); }
    finally { setFetching(false); }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault(); setError('');
    const digits = phone.replace(/\D/g, '');
    if (!name.trim())       { setError('Name is required.');                          return; }
    if (!email.trim())      { setError('Email is required.');                         return; }
    if (digits.length !== 10) { setError('Enter a valid 10-digit number.');           return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    setFetching(true);
    try {
      const res  = await fetch('/api/customer/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone_number: digits, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed.'); return; }
      saveCustomerSession(data.customer.phone, data.customer.name, data.token);
      setCustomer(data.customer);
      await loadCards(data.customer.phone, data.customer.name);
    } catch { setError('Connection error.'); }
    finally { setFetching(false); }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault(); setError('');
    if (!forgotEmail.trim()) { setError('Enter your email address.'); return; }
    setFetching(true);
    try {
      await fetch('/api/customer/auth/forgot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      setForgotSent(true);
    } catch { setError('Connection error.'); }
    finally { setFetching(false); }
  }

  async function saveField(field: string, value: string) {
    const res = await fetch('/api/customer/profile', {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ [field]: value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed.');
    setCustomer(prev => prev ? { ...prev, [field]: value || null } : prev);
    if (field === 'name') saveCustomerSession(customer?.phone ?? '', value, getCustomerToken() ?? undefined);
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault(); setPwError(''); setPwDone(false);
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwSaving(true);
    try {
      const res  = await fetch('/api/customer/profile/password', {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ current_password: curPw, new_password: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || 'Failed.'); return; }
      setPwDone(true); setCurPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => { setPwSection(false); setPwDone(false); }, 2000);
    } catch { setPwError('Connection error.'); }
    finally { setPwSaving(false); }
  }

  function handleLogout() {
    clearCustomerSession(); setPhone(''); setCustomer(null); setCards([]); setStores([]); setPhase('login');
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-bg-muted"><Spinner /></div>;
  }

  // ── Login / Register / Forgot ──────────────────────────────────────────────
  if (phase === 'login') {
    return (
      <main className="min-h-screen bg-bg-muted flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-lg">
              <span className="text-2xl">⭐</span>
            </div>
            <h1 className="text-2xl font-bold text-text-dark">
              {authMode === 'login' ? 'Welcome back' : authMode === 'register' ? 'Create account' : 'Reset password'}
            </h1>
            <p className="text-text-medium text-sm">
              {authMode === 'login' ? 'Sign in to your rewards account'
                : authMode === 'register' ? 'Join LetLoyal to earn rewards'
                : 'Enter your email to receive a reset link'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-border-light p-5 shadow-sm">
            {/* ── Forgot password ── */}
            {authMode === 'forgot' && (
              forgotSent ? (
                <div className="text-center space-y-3 py-4">
                  <div className="text-4xl">📧</div>
                  <p className="font-semibold text-text-dark">Check your email</p>
                  <p className="text-sm text-text-medium">If an account exists with that email, we sent a reset link. Check your inbox (and spam folder).</p>
                  <button onClick={() => { setAuthMode('login'); setForgotSent(false); setForgotEmail(''); }}
                    className="text-sm text-primary font-semibold hover:underline">Back to Sign In</button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="form-label">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                        placeholder="you@example.com" className="form-input pl-9" autoFocus />
                    </div>
                  </div>
                  {error && <p className="text-sm text-status-error">{error}</p>}
                  <button type="submit" disabled={fetching}
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
                    {fetching ? <span className="flex items-center justify-center gap-2"><Spinner sm />Sending…</span> : 'Send Reset Link'}
                  </button>
                  <button type="button" onClick={() => { setAuthMode('login'); setError(''); }}
                    className="w-full text-sm text-text-medium hover:text-text-dark text-center">← Back to Sign In</button>
                </form>
              )
            )}

            {/* ── Login ── */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="form-label">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center px-3 rounded-xl border border-border-light bg-bg-muted text-text-medium font-medium text-sm flex-shrink-0">🇮🇳 +91</div>
                    <div className="relative flex-1">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="98765 43210" className="form-input pl-9" inputMode="numeric" autoFocus />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" className="form-input pl-9 pr-10" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <button type="button" onClick={() => { setAuthMode('forgot'); setError(''); }}
                    className="text-sm text-primary font-medium hover:underline">Forgot password?</button>
                </div>
                {error && <p className="text-sm text-status-error">{error}</p>}
                <button type="submit" disabled={fetching || phone.replace(/\D/g, '').length !== 10}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
                  {fetching ? <span className="flex items-center justify-center gap-2"><Spinner sm />Signing in…</span> : 'Sign In'}
                </button>
                <p className="text-center text-sm text-text-medium">
                  New here?{' '}
                  <button type="button" onClick={() => { setAuthMode('register'); setError(''); }}
                    className="text-primary font-semibold hover:underline">Create account →</button>
                </p>
              </form>
            )}

            {/* ── Register ── */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="form-label">Full Name <span className="text-status-error">*</span></label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your name" className="form-input pl-9" autoFocus />
                  </div>
                </div>
                <div>
                  <label className="form-label">Email Address <span className="text-status-error">*</span></label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" className="form-input pl-9" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Mobile Number <span className="text-status-error">*</span></label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center px-3 rounded-xl border border-border-light bg-bg-muted text-text-medium font-medium text-sm flex-shrink-0">🇮🇳 +91</div>
                    <div className="relative flex-1">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="98765 43210" className="form-input pl-9" inputMode="numeric" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="form-label">Password <span className="text-status-error">*</span></label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min 8 characters" className="form-input pl-9 pr-10" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-status-error">{error}</p>}
                <button type="submit" disabled={fetching}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-1">
                  {fetching ? <span className="flex items-center justify-center gap-2"><Spinner sm />Creating…</span> : 'Create Account'}
                </button>
                <p className="text-center text-sm text-text-medium">
                  Have an account?{' '}
                  <button type="button" onClick={() => { setAuthMode('login'); setError(''); }}
                    className="text-primary font-semibold hover:underline">Sign in →</button>
                </p>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-text-light">Powered by LetLoyal</p>
        </div>
      </main>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const displayName = customer?.name?.split(' ')[0] ?? null;
  const unlocked    = cards.filter(c => c.reward_status === 'unlocked');

  return (
    <main className="min-h-screen bg-bg-muted flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border-light px-4 pt-5 pb-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          {tab === 'cards'   && <><p className="text-xl font-bold text-text-dark">{displayName ? `Hi, ${displayName}! 👋` : 'My Rewards 👋'}</p><p className="text-sm text-text-light mt-0.5">{cards.length === 0 ? 'No loyalty cards yet' : `You have ${cards.length} loyalty card${cards.length > 1 ? 's' : ''}.`}</p></>}
          {tab === 'scan'    && <p className="text-xl font-bold text-text-dark">Scan a QR Code</p>}
          {tab === 'account' && <p className="text-xl font-bold text-text-dark">My Account</p>}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

          {/* ── Cards tab ── */}
          {tab === 'cards' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-text-medium uppercase tracking-wide">My Loyalty Cards</h2>
                <button onClick={() => loadCards(phone, customer?.name ?? null)} disabled={fetching}
                  className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                  <RefreshCw size={12} className={fetching ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
              {cards.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border-light p-10 text-center space-y-3">
                  <CreditCard size={40} className="text-text-light mx-auto opacity-30" />
                  <p className="font-semibold text-text-medium">No loyalty cards yet</p>
                  <p className="text-sm text-text-light">Scan a QR code at any LetLoyal store to start earning rewards.</p>
                </div>
              ) : (
                <>
                  {unlocked.length > 0 && (
                    <section className="space-y-3">
                      <p className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1"><Gift size={12} /> Rewards Ready to Claim ({unlocked.length})</p>
                      {unlocked.map((card, i) => <LoyaltyCardItem key={i} card={card} phone={phone} />)}
                    </section>
                  )}
                  {cards.filter(c => c.reward_status !== 'unlocked').length > 0 && (
                    <section className="space-y-3">
                      {unlocked.length > 0 && <p className="text-xs font-bold text-text-medium uppercase tracking-wide">In Progress ({cards.filter(c => c.reward_status !== 'unlocked').length})</p>}
                      {cards.filter(c => c.reward_status !== 'unlocked').map((card, i) => <LoyaltyCardItem key={i} card={card} phone={phone} />)}
                    </section>
                  )}
                </>
              )}
              {stores.length > 0 && (
                <section className="space-y-3 pt-2">
                  <h2 className="text-xs font-semibold text-text-medium uppercase tracking-wide flex items-center gap-1.5"><MapPin size={13} /> Discover Stores</h2>
                  <p className="text-xs text-text-light -mt-1">Earn rewards at any LetLoyal store</p>
                  {stores.map((store, i) => <DiscoverCard key={i} store={store} />)}
                </section>
              )}
            </>
          )}

          {/* ── Scan tab ── */}
          {tab === 'scan' && (
            <div className="bg-white rounded-2xl border border-border-light p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center mx-auto">
                <ScanLine size={40} className="text-primary" />
              </div>
              <div>
                <p className="font-bold text-text-dark text-lg">Scan a Store QR Code</p>
                <p className="text-sm text-text-light mt-1">Ask the merchant to show their QR code, then scan it with your camera to earn rewards.</p>
              </div>
              <div className="bg-bg-muted rounded-xl p-4 text-sm text-text-medium text-left space-y-1.5">
                <p className="font-semibold text-text-dark text-xs uppercase tracking-wide mb-2">How it works</p>
                <p>1. Ask the merchant to open their QR</p>
                <p>2. Scan with your phone camera</p>
                <p>3. Your stamp is added automatically!</p>
              </div>
            </div>
          )}

          {/* ── Account tab ── */}
          {tab === 'account' && customer && (
            <div className="space-y-4">
              {/* Profile card */}
              <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
                {/* Avatar + name header */}
                <div className="flex items-center gap-3 p-4 border-b border-border-light">
                  <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-primary">{(customer.name ?? 'C')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-bold text-text-dark">{customer.name ?? 'Customer'}</p>
                    <p className="text-sm text-text-light">+91 {customer.phone}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 divide-x divide-border-light border-b border-border-light">
                  <div className="p-3 text-center">
                    <p className="text-xl font-bold text-text-dark">{cards.length}</p>
                    <p className="text-xs text-text-light">Loyalty Cards</p>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-xl font-bold text-primary">{unlocked.length}</p>
                    <p className="text-xs text-text-light">Rewards Ready</p>
                  </div>
                </div>

                {/* Editable fields */}
                <ProfileField label="Full Name" value={customer.name} icon={<User size={15} />}
                  onSave={v => saveField('name', v)} />
                <ProfileField label="Email Address" value={customer.email} icon={<Mail size={15} />}
                  type="email" onSave={v => saveField('email', v)} />
                <ProfileField label="Birthday" value={customer.birthday} icon={<Calendar size={15} />}
                  type="date" onSave={v => saveField('birthday', v)} />
                <ProfileField label="Gender" value={customer.gender} icon={<Venus size={15} />}
                  options={[
                    { value: 'male',              label: 'Male' },
                    { value: 'female',            label: 'Female' },
                    { value: 'other',             label: 'Other' },
                    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                  ]}
                  onSave={v => saveField('gender', v)} />
              </div>

              {/* Change password */}
              <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
                <button onClick={() => setPwSection(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Lock size={15} className="text-text-light" />
                    <span className="text-sm font-semibold text-text-dark">Change Password</span>
                  </div>
                  {pwSection ? <ChevronUp size={16} className="text-text-light" /> : <ChevronDown size={16} className="text-text-light" />}
                </button>
                {pwSection && (
                  <div className="px-4 pb-4 pt-0 border-t border-border-light">
                    {pwDone ? (
                      <p className="text-center text-sm font-semibold text-primary py-4">✓ Password updated!</p>
                    ) : (
                      <form onSubmit={handleChangePassword} className="space-y-3 pt-3">
                        <div>
                          <label className="form-label">Current Password</label>
                          <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)}
                            placeholder="••••••••" className="form-input" />
                        </div>
                        <div>
                          <label className="form-label">New Password</label>
                          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                            placeholder="Min 8 characters" className="form-input" />
                        </div>
                        <div>
                          <label className="form-label">Confirm New Password</label>
                          <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                            placeholder="Repeat new password" className="form-input" />
                        </div>
                        {pwError && <p className="text-sm text-status-error">{pwError}</p>}
                        <button type="submit" disabled={pwSaving}
                          className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors">
                          {pwSaving ? 'Updating…' : 'Update Password'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-200 text-status-error font-semibold hover:bg-red-50 transition-colors">
                <LogOut size={18} /> Sign Out
              </button>

              <p className="text-center text-xs text-text-light pb-2">Powered by LetLoyal</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-border-light z-20">
        <div className="max-w-lg mx-auto flex">
          {([
            { id: 'cards' as Tab,   label: 'Cards',   icon: <CreditCard size={22} /> },
            { id: 'scan'  as Tab,   label: 'Scan',    icon: <ScanLine   size={22} /> },
            { id: 'account' as Tab, label: 'Account', icon: <User       size={22} /> },
          ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${tab === id ? 'text-primary' : 'text-text-light hover:text-text-medium'}`}>
              {icon}{label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/my-rewards/page.tsx
git commit -m "feat: my-rewards full auth + profile editing + account tab"
```

---

## Task 11: Build Verification & Deploy

**Files:** VPS deployment

- [ ] **Step 1: Run local build check**

```bash
cd "C:\Users\jaiso\OneDrive\Desktop\Letloyal\letloyal-production"
npm run build 2>&1 | tail -30
```

Expected: `✓ Compiled successfully` with no TypeScript errors. If errors exist, fix them before proceeding.

- [ ] **Step 2: Push to GitHub**

```bash
git push origin master
```

- [ ] **Step 3: Deploy to VPS**

```bash
ssh root@72.60.18.98 "cd /var/www/letloyal-production && git pull origin master && npm run build 2>&1 | tail -20 && pm2 restart letloyal-production && pm2 show letloyal-production | grep -E 'status|restart'"
```

Expected: PM2 status = `online`.

- [ ] **Step 4: Smoke test on device**

1. Open `https://pilot.letloyal.com/my-rewards` → should show login screen with Sign In / Create account toggle
2. Create a new account → should auto-login and show dashboard
3. Tap Account tab → should show profile fields (name, email, birthday, gender) all editable
4. Tap Change Password → should expand inline form
5. Open `https://pilot.letloyal.com/m/kebab-grill/analytics` → should show analytics page in nav
6. Confirm phone numbers are masked in merchant dashboard recent transactions

---

## Self-Review Checklist

- ✅ DB migration — customers columns + customer_reset_tokens table
- ✅ CUSTOMER_JWT_SECRET env var added on VPS and local
- ✅ Register API (name + email + phone + password)
- ✅ Login API (phone + password, handles no-password accounts)
- ✅ Forgot password (email → reset link via mail.ts)
- ✅ Reset password API (token → hash verify → set password → auto-login)
- ✅ Reset password page at `/customer/reset-password`
- ✅ Profile GET + PUT (name, email, phone with pw confirm, birthday, gender)
- ✅ Change password API
- ✅ maskPhone extracted to utils.ts and used in merchant pages
- ✅ Analytics API (gender stats, age groups, upcoming birthdays)
- ✅ Analytics page at `/m/[slug]/analytics`
- ✅ Analytics nav item in DashboardShell
- ✅ my-rewards full rewrite (login/register/forgot, account tab with inline editing)
- ✅ WhatsApp button is dummy (alert "not available in this plan")
- ✅ All phone numbers in merchant views masked
- ✅ Email/birthday/gender never exposed to merchants
