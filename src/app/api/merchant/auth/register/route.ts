import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendMerchantEmailOTP } from '@/lib/mail';
import { isRateLimited, rateLimitKey } from '@/lib/rateLimit';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
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
      'SELECT id, email_verified FROM merchants WHERE email = ?',
      [normEmail],
    );
    if (existing?.email_verified) {
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
    const otp     = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    if (existing) {
      // Unverified account exists — update it so they can re-register
      await query(
        'UPDATE merchants SET password_hash=?, slug=?, business_name=?, phone=?, email_otp=?, email_otp_expires=?, status=? WHERE id=?',
        [passwordHash, slug, bizName, phone.trim(), otp, expires, 'pending', existing.id],
      );
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
