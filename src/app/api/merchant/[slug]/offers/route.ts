import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

type RouteContext = { params: Promise<{ slug: string }> };

// GET — list all offers for this merchant
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const auth = requireMerchant(req, slug);

    const offers = await query<{
      id: string; title: string; description: string | null; valid_until: string; created_at: string;
    }>(
      'SELECT id, title, description, valid_until, created_at FROM instant_offers WHERE merchant_id = ? ORDER BY valid_until DESC',
      [auth.sub],
    );

    return NextResponse.json({ ok: true, offers });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[GET /api/merchant/[slug]/offers]', err);
    return NextResponse.json({ error: 'Failed to load offers.' }, { status: 500 });
  }
}

// POST — create offer
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const auth = requireMerchant(req, slug);

    const body = await req.json();
    const title       = String(body.title ?? '').trim();
    const description = body.description ? String(body.description).trim() : null;
    const valid_until = body.valid_until ? new Date(body.valid_until) : null;

    if (!title || title.length > 120) {
      return NextResponse.json({ error: 'Title is required (max 120 chars).' }, { status: 400 });
    }
    if (!valid_until || isNaN(valid_until.getTime()) || valid_until <= new Date()) {
      return NextResponse.json({ error: 'valid_until must be a future datetime.' }, { status: 400 });
    }

    const id = randomUUID();
    await query(
      'INSERT INTO instant_offers (id, merchant_id, title, description, valid_until) VALUES (?, ?, ?, ?, ?)',
      [id, auth.sub, title, description, valid_until.toISOString().slice(0, 19).replace('T', ' ')],
    );

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[POST /api/merchant/[slug]/offers]', err);
    return NextResponse.json({ error: 'Failed to create offer.' }, { status: 500 });
  }
}
