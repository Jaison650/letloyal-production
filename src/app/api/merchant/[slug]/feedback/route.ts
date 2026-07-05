import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { query } from '@/lib/db';

interface FeedbackRow {
  id:          string;
  message:     string;
  rating:      number | null;
  is_anonymous: number;      // MySQL BOOLEAN → 0/1
  customer_name: string | null;
  phone_number:  string | null;
  created_at:  string;
}

type RouteContext = { params: Promise<{ slug: string }> };

// ── GET /api/merchant/[slug]/feedback ─────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const auth = requireMerchant(req, slug);

    const url       = new URL(req.url);
    const limitRaw  = Number(url.searchParams.get('limit')  ?? 50);
    const offsetRaw = Number(url.searchParams.get('offset') ?? 0);
    // mysql2's execute() (prepared statements) fails on bound LIMIT/OFFSET
    // params, so these are validated as safe integers and inlined directly.
    const limit  = Number.isFinite(limitRaw)  ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100) : 50;
    const offset = Number.isFinite(offsetRaw) ? Math.max(Math.trunc(offsetRaw), 0) : 0;

    const rows = await query<FeedbackRow>(
      `SELECT
         f.id,
         f.message,
         f.rating,
         f.is_anonymous,
         f.created_at,
         -- Hide identity for anonymous submissions
         CASE WHEN f.is_anonymous = 1 THEN NULL ELSE cu.name  END AS customer_name,
         CASE WHEN f.is_anonymous = 1 THEN NULL ELSE cu.phone_number END AS phone_number
       FROM feedback f
       LEFT JOIN customers cu ON f.customer_id = cu.id
      WHERE f.merchant_id = ?
      ORDER BY f.created_at DESC
      LIMIT ${limit} OFFSET ${offset}`,
      [auth.sub],
    );

    // Compute average rating
    const withRating = rows.filter((r) => r.rating !== null);
    const avgRating  = withRating.length
      ? Math.round((withRating.reduce((s, r) => s + (r.rating ?? 0), 0) / withRating.length) * 10) / 10
      : null;

    return NextResponse.json({
      ok:         true,
      feedback:   rows,
      avg_rating: avgRating,
      total:      rows.length,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[GET /api/merchant/[slug]/feedback]', err);
    return NextResponse.json({ error: 'Failed to load feedback.' }, { status: 500 });
  }
}
