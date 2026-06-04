import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const stats = await queryOne<{
      total_merchants:   number;
      total_customers:   number;
      total_visits:      number;
      total_redemptions: number;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM merchants WHERE status = 'active') AS total_merchants,
         (SELECT COUNT(*) FROM customers)                          AS total_customers,
         (SELECT COUNT(*) FROM visits)                            AS total_visits,
         (SELECT COUNT(*) FROM redemptions)                       AS total_redemptions`,
    );

    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[GET /api/admin/stats]', err);
    return NextResponse.json({ error: 'Failed to load stats.' }, { status: 500 });
  }
}
