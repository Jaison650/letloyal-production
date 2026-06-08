# Customer Auth & Profile — Design Spec
**Date:** 2026-06-08  
**Project:** LetLoyal India Pilot (`letloyal-production`)  
**Status:** Approved

---

## Overview

Add proper customer authentication (email + phone + password) and a full editable profile to the `/my-rewards` dashboard. Merchants are restricted to seeing only masked phone numbers and first names — no personal data is ever exposed.

---

## 1. Authentication Flow

### Sign Up
Fields (all mandatory):
- Full Name
- Email Address
- Mobile Number (+91, 10 digits)
- Password (min 8 characters, bcrypt-hashed)

On success: auto-login → store session in localStorage → redirect to Cards tab.

### Login
Fields:
- Mobile Number
- Password

On success: fetch customer data → store session → go to dashboard.  
Session stays active for **30 days from last activity** (existing `ll_customer` localStorage key). No manual logout needed unless user chooses to.

### Forgot Password
- Customer enters their email address
- System looks up account by email → sends reset link (uses existing `mail.ts` / nodemailer)
- Reset link contains a short-lived signed token (1-hour expiry, stored in `customer_reset_tokens` table)
- Customer clicks link → enters new password → auto-login

### Existing customers (phone-only accounts)
Customers already in the DB (no password) are prompted to set a password on their next visit to `/my-rewards`. They enter their phone number → system detects no password → shows "Set your password" screen.

---

## 2. Database Changes

### `customers` table — new columns
```sql
ALTER TABLE customers
  ADD COLUMN password_hash VARCHAR(255)  NULL,
  ADD COLUMN email         VARCHAR(255)  NULL,
  ADD COLUMN birthday      DATE          NULL,
  ADD COLUMN gender        ENUM('male','female','other','prefer_not_to_say') NULL,
  ADD UNIQUE KEY idx_customers_email (email);
```

### New table: `customer_reset_tokens`
```sql
CREATE TABLE customer_reset_tokens (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  customer_id  VARCHAR(36)  NOT NULL,
  token_hash   VARCHAR(255) NOT NULL,
  expires_at   TIMESTAMP    NOT NULL,
  used_at      TIMESTAMP    NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
```

---

## 3. API Routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/customer/auth/register` | Public | Create account |
| POST | `/api/customer/auth/login` | Public | Login → return customer data |
| POST | `/api/customer/auth/forgot` | Public | Send reset email |
| POST | `/api/customer/auth/reset` | Public | Consume token, set new password |
| GET | `/api/customer/profile` | Customer token | Get own profile |
| PUT | `/api/customer/profile` | Customer token | Update name/email/phone/birthday/gender |
| PUT | `/api/customer/profile/password` | Customer token | Change password (requires current password) |

### Customer session / token
After login, server returns a short JWT (7-day, edge-safe, same pattern as merchant auth). Stored in localStorage alongside the existing `ll_customer` key. All profile API calls send it as `Authorization: Bearer <token>`.

---

## 4. Profile Fields

| Field | Mandatory at signup | Editable | Merchant-visible |
|-------|-------------------|----------|-----------------|
| Name | ✅ | ✅ | First name only |
| Email | ✅ | ✅ | ❌ Never |
| Phone | ✅ | ✅ (with password confirm) | Masked (98••••666) |
| Password | ✅ | ✅ (change password flow) | ❌ Never |
| Birthday | ❌ | ✅ | ❌ Never |
| Gender | ❌ | ✅ | ❌ Never |

---

## 5. `/my-rewards` Page Changes

### Login screen
Toggle between **Sign In** and **Create Account** (same page, two states).

### Account tab
Replace the current simple account tab with:
- Profile card (avatar initial + name + phone)
- Stats row (cards count + rewards ready)
- Editable field list: Name, Email, Phone, Birthday, Gender — each row has Edit/Add button → inline edit mode
- Change Password row → separate inline form (current password + new + confirm)
- Sign Out button

### Phone masking — merchant side
Audit and enforce masked phone in:
- `/m/[slug]` dashboard recent transactions
- `/m/[slug]/customers` customer list
- `/m/[slug]/validate` validate page
- All merchant-facing API responses

The `maskPhone()` helper already exists in the dashboard page — extract to `src/lib/utils.ts` and reuse everywhere.

---

## 6. Security

- Passwords: bcrypt with salt rounds = 12
- Reset tokens: crypto.randomBytes(32) → SHA-256 hash stored in DB, raw token in email link
- Reset tokens expire in 1 hour, single-use
- Phone change: requires current password confirmation
- Customer JWT: 7-day, signed with `CUSTOMER_JWT_SECRET` env var (separate from merchant secret)
- Email: case-insensitive storage (lowercased before save/lookup)

---

## 7. Merchant Analytics Page

### Location
New page: `/m/[slug]/analytics` — added to sidebar nav between Customers and Validate.

### Sections

#### Gender Split
Horizontal bar chart showing % male / female / other / not shared among the merchant's customers who provided gender. Shows count of customers the data is based on.

#### Age Groups
Horizontal bar chart: 18–24 / 25–34 / 35–44 / 45+ — computed from birthday (year). Shows count of customers the data is based on. Customers with no birthday are excluded and a "not shared" count shown.

#### Upcoming Birthdays (next 30 days)
List of customers whose birthday (month + day) falls within the next 30 days. Each row shows:
- First name only
- Masked phone (98••••666)
- Days until birthday ("Tomorrow" / "In X days")
- WhatsApp button (dummy — clicking shows "Not available in this plan" toast/modal)

**Privacy rules enforced:**
- Full DOB never shown — only relative days
- No email, gender, or full phone exposed
- Year of birth never shown to merchant

### API Route
`GET /api/merchant/[slug]/analytics`  
Returns: `{ gender_stats, age_groups, upcoming_birthdays }`

### WhatsApp / Push Notification
Buttons are rendered but non-functional. Clicking either shows an inline message:
> "WhatsApp & push notifications are not available in this plan. Contact support to upgrade."

This is a UI-only placeholder — no backend work needed for notifications.

---

## 8. Out of Scope (this phase)

- SMS OTP verification
- Profile photo upload
- Email verification on signup (just save the email, no verify step)
- Social login (Google/Apple)
- WhatsApp Business API integration
- Push notification service

---

## 9. Files to Create / Modify

**New files:**
- `src/app/api/customer/auth/register/route.ts`
- `src/app/api/customer/auth/login/route.ts`
- `src/app/api/customer/auth/forgot/route.ts`
- `src/app/api/customer/auth/reset/route.ts`
- `src/app/customer/reset-password/page.tsx` — reset password landing page
- `src/app/api/customer/profile/route.ts` (GET + PUT)
- `src/app/api/customer/profile/password/route.ts` (PUT)
- `src/lib/customerAuth.ts` — JWT helpers for customer tokens
- `src/app/api/merchant/[slug]/analytics/route.ts`
- `src/app/m/[slug]/analytics/page.tsx`

**Modified files:**
- `src/app/my-rewards/page.tsx` — login/register toggle, account tab, profile editing
- `src/lib/customerSession.ts` — add JWT token storage alongside session
- `src/lib/utils.ts` — extract + export `maskPhone()`
- `src/app/m/[slug]/page.tsx` — use shared `maskPhone()`
- `src/app/m/[slug]/customers/page.tsx` — mask phone
- `src/app/m/[slug]/validate/page.tsx` — mask phone
- `src/components/merchant/DashboardShell.tsx` — add Analytics nav item
- All merchant API routes that return phone numbers

**DB migration:** Run ALTER TABLE + CREATE TABLE on VPS MySQL.
