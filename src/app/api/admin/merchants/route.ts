import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { hashPassword, requireAdmin } from '@/lib/auth';
import { sendMerchantWelcome } from '@/lib/mail';

interface MerchantListRow {
  id:             string;
  slug:           string;
  business_name:  string;
  email:          string;
  status:         string;
  created_at:     string;
  customer_count: number;
  visit_count:    number;
}

// ── GET /api/admin/merchants ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const merchants = await query<MerchantListRow>(
      `SELECT
         m.id, m.slug, m.business_name, m.email, m.status, m.created_at,
         COUNT(DISTINCT cm.customer_id) AS customer_count,
         COUNT(DISTINCT v.id)           AS visit_count
       FROM merchants m
       LEFT JOIN customer_merchant cm ON cm.merchant_id = m.id
       LEFT JOIN visits            v  ON v.merchant_id  = m.id
       GROUP BY m.id
       ORDER BY m.created_at DESC`,
    );

    return NextResponse.json({ ok: true, merchants });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[GET /api/admin/merchants]', err);
    return NextResponse.json({ error: 'Failed to load merchants.' }, { status: 500 });
  }
}

// ── POST /api/admin/merchants  (create) ───────────────────────────────
export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);

    const { slug, business_name, email, password } = await req.json();

    // ── Validate ──────────────────────────────────────────────────────
    if (!slug || !business_name || !email || !password) {
      return NextResponse.json(
        { error: 'slug, business_name, email and password are all required.' },
        { status: 400 },
      );
    }

    const slugClean = String(slug).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slugClean)) {
      return NextResponse.json(
        { error: 'Slug must be 3-50 chars, lowercase letters, numbers and hyphens only.' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 },
      );
    }

    // ── Check uniqueness ──────────────────────────────────────────────
    const existingSlug = await queryOne<{ id: string }>(
      'SELECT id FROM merchants WHERE slug = ?',
      [slugClean],
    );
    if (existingSlug) {
      return NextResponse.json({ error: 'This slug is already taken.' }, { status: 409 });
    }

    const existingEmail = await queryOne<{ id: string }>(
      'SELECT id FROM merchants WHERE email = ?',
      [email.toLowerCase().trim()],
    );
    if (existingEmail) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
    }

    // ── Create merchant ───────────────────────────────────────────────
    const passwordHash = await hashPassword(password);
    await query(
      `INSERT INTO merchants (id, slug, business_name, email, password_hash, status)
       VALUES (UUID(), ?, ?, ?, ?, 'active')`,
      [slugClean, business_name.trim(), email.toLowerCase().trim(), passwordHash],
    );

    const created = await queryOne<{ id: string; slug: string }>(
      'SELECT id, slug FROM merchants WHERE slug = ?',
      [slugClean],
    );

    // Fire-and-forget welcome email with login credentials
    if (created) {
      sendMerchantWelcome(
        email.toLowerCase().trim(),
        business_name.trim(),
        email.toLowerCase().trim(),
        created.slug,
      ).catch(() => {});
    }

    return NextResponse.json({ ok: true, merchant: created }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[POST /api/admin/merchants]', err);
    return NextResponse.json({ error: 'Failed to create merchant.' }, { status: 500 });
  }
}
