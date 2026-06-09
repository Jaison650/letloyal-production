import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { query } from '@/lib/db';
import { pushBlastToCustomers, countCustomerSubs } from '@/lib/webpush';

type RouteContext = { params: Promise<{ slug: string }> };

// GET — returns subscriber count + recent blasts
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const auth = requireMerchant(req, slug);

    const [subCount, blasts] = await Promise.all([
      countCustomerSubs(auth.sub),
      query<{ id: string; title: string; body: string; recipient_count: number; sent_at: string }>(
        `SELECT id, title, body, recipient_count, sent_at
           FROM push_blasts WHERE merchant_id = ?
           ORDER BY sent_at DESC LIMIT 10`,
        [auth.sub],
      ),
    ]);

    return NextResponse.json({ subscriber_count: subCount, blasts });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[GET /api/merchant/[slug]/push]', err);
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}

// POST — send a blast to all opted-in customers
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const auth = requireMerchant(req, slug);

    const { title, body } = await req.json();
    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'Title and body are required.' }, { status: 400 });
    }
    if (title.length > 80)  return NextResponse.json({ error: 'Title too long (max 80 chars).' }, { status: 400 });
    if (body.length > 200)  return NextResponse.json({ error: 'Message too long (max 200 chars).' }, { status: 400 });

    const sent = await pushBlastToCustomers(auth.sub, title.trim(), body.trim());

    // Log the blast
    await query(
      'INSERT INTO push_blasts (merchant_id, title, body, recipient_count) VALUES (?, ?, ?, ?)',
      [auth.sub, title.trim(), body.trim(), sent],
    );

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[POST /api/merchant/[slug]/push]', err);
    return NextResponse.json({ error: 'Failed to send notification.' }, { status: 500 });
  }
}
