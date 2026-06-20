import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendMerchantWelcome } from '@/lib/mail';
import { isRateLimited, rateLimitKey } from '@/lib/rateLimit';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
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
    const normPhone = phone.trim();
    const bizName   = business_name.trim();

    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM merchants WHERE email = ?',
      [normEmail],
    );
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    // Generate unique slug from business name
    let baseSlug = slugify(bizName);
    if (baseSlug.length < 3) baseSlug = `merchant-${baseSlug}`;
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const taken = await queryOne<{ id: string }>('SELECT id FROM merchants WHERE slug = ?', [slug]);
      if (!taken) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const passwordHash = await hashPassword(password);
    await query(
      `INSERT INTO merchants (id, slug, business_name, email, phone, password_hash, status)
       VALUES (UUID(), ?, ?, ?, ?, ?, 'active')`,
      [slug, bizName, normEmail, normPhone, passwordHash],
    );

    sendMerchantWelcome(normEmail, bizName, normEmail, slug).catch(() => {});

    return NextResponse.json({ ok: true, slug }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/merchant/auth/register]', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
