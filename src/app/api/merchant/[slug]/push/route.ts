import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { Segment, pushBlastSegmented, countSegmentSubs } from '@/lib/webpush';

type RouteContext = { params: Promise<{ slug: string }> };

const BLAST_LIMIT = 4; // per rolling 30-day window
const VALID_SEGMENTS: Segment[] = ['all', 'near_milestone', 'loyal', 'one_time', 'inactive'];

async function blastsThisMonth(merchantId: string): Promise<number> {
  const row = await queryOne<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM push_blasts
      WHERE merchant_id = ? AND sent_at >= NOW() - INTERVAL 30 DAY`,
    [merchantId],
  );
  return Number(row?.cnt ?? 0);
}

// GET — returns subscriber count + segment count + blast quota + recent blasts
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const auth = requireMerchant(req, slug);

    const url      = new URL(req.url);
    const segParam = url.searchParams.get('segment') as Segment | null;
    const segment: Segment = segParam && VALID_SEGMENTS.includes(segParam) ? segParam : 'all';

    const [subCount, segCount, blasts, used] = await Promise.all([
      countSegmentSubs(auth.sub, 'all'),
      countSegmentSubs(auth.sub, segment),
      query<{ id: string; title: string; body: string; recipient_count: number; sent_at: string }>(
        `SELECT id, title, body, recipient_count, sent_at
           FROM push_blasts WHERE merchant_id = ?
           ORDER BY sent_at DESC LIMIT 10`,
        [auth.sub],
      ),
      blastsThisMonth(auth.sub),
    ]);

    return NextResponse.json({
      subscriber_count: subCount,
      segment_count:    segCount,
      blasts,
      blasts_used:  used,
      blast_limit:  BLAST_LIMIT,
    });
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

    // Rate limit check
    const used = await blastsThisMonth(auth.sub);
    if (used >= BLAST_LIMIT) {
      return NextResponse.json(
        { error: `Monthly blast limit reached (${BLAST_LIMIT}/month). Available again as older blasts roll off.` },
        { status: 429 },
      );
    }

    const { title, body, segment: segParam } = await req.json();
    const segment: Segment = VALID_SEGMENTS.includes(segParam) ? segParam : 'all';

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'Title and body are required.' }, { status: 400 });
    }
    if (title.length > 80)  return NextResponse.json({ error: 'Title too long (max 80 chars).' }, { status: 400 });
    if (body.length > 200)  return NextResponse.json({ error: 'Message too long (max 200 chars).' }, { status: 400 });

    // Look up business name to prefix the notification title
    const merchantRow = await queryOne<{ business_name: string }>(
      'SELECT business_name FROM merchants WHERE id = ?',
      [auth.sub],
    );
    const bizName   = merchantRow?.business_name ?? slug;
    const fullTitle = `${bizName}: ${title.trim()}`;
    const scanUrl   = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://letloyal.in'}/my-rewards?merchant=${slug}`;

    const sent = await pushBlastSegmented(auth.sub, segment, fullTitle, body.trim(), scanUrl);

    // Log the blast
    await query(
      'INSERT INTO push_blasts (merchant_id, title, body, recipient_count) VALUES (?, ?, ?, ?)',
      [auth.sub, title.trim(), body.trim(), sent],
    );

    return NextResponse.json({ ok: true, sent, blasts_used: used + 1, blast_limit: BLAST_LIMIT });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[POST /api/merchant/[slug]/push]', err);
    return NextResponse.json({ error: 'Failed to send notification.' }, { status: 500 });
  }
}
