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
