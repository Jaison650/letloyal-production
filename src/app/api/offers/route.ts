import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET active offers for a merchant by slug — public, no auth required
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug');
    if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

    const offers = await query<{
      id: string; title: string; description: string | null; valid_until: string;
    }>(
      `SELECT o.id, o.title, o.description, o.valid_until
       FROM instant_offers o
       JOIN merchants m ON m.id = o.merchant_id
       WHERE m.slug = ? AND o.valid_until > NOW()
       ORDER BY o.valid_until ASC`,
      [slug],
    );

    return NextResponse.json({ ok: true, offers });
  } catch (err) {
    console.error('[GET /api/offers]', err);
    return NextResponse.json({ error: 'Failed to load offers.' }, { status: 500 });
  }
}
