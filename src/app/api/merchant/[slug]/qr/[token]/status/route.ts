import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { queryOne } from '@/lib/db';

interface QRTokenRow {
  status:       'active' | 'used' | 'revoked';
  used_at:      string | null;
  safety_expiry: string;
}

type RouteContext = { params: Promise<{ slug: string; token: string }> };

// ── GET /api/merchant/[slug]/qr/[token]/status  (merchant polling) ────
// Called every 2 seconds by QRPanel to detect scan or expiry.
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug, token } = await params;
    const auth = requireMerchant(req, slug);

    const row = await queryOne<QRTokenRow>(
      `SELECT status, used_at, safety_expiry
         FROM qr_tokens
        WHERE token = ? AND merchant_id = ?`,
      [token, auth.sub],
    );

    if (!row) {
      return NextResponse.json({ error: 'Token not found.' }, { status: 404 });
    }

    // Treat as expired if still 'active' but safety_expiry has passed
    const effectiveStatus =
      row.status === 'active' && new Date() > new Date(row.safety_expiry)
        ? 'expired'
        : row.status;

    return NextResponse.json({
      status:  effectiveStatus,
      used_at: row.used_at,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[GET /api/merchant/[slug]/qr/[token]/status]', err);
    return NextResponse.json({ error: 'Failed to check status.' }, { status: 500 });
  }
}
