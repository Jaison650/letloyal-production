import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

type RouteContext = { params: Promise<{ slug: string; token: string }> };

// ── DELETE /api/merchant/[slug]/qr/[token]  (revoke) ─────────────────
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug, token } = await params;
    const auth = requireMerchant(req, slug);

    const existing = await queryOne<{ id: string; status: string }>(
      'SELECT id, status FROM qr_tokens WHERE token = ? AND merchant_id = ?',
      [token, auth.sub],
    );

    if (!existing) {
      return NextResponse.json({ error: 'Token not found.' }, { status: 404 });
    }

    if (existing.status !== 'active') {
      return NextResponse.json(
        { error: 'Token is already used or revoked.' },
        { status: 409 },
      );
    }

    await query(
      'UPDATE qr_tokens SET status = ?, revoked_at = NOW() WHERE id = ?',
      ['revoked', existing.id],
    );

    return NextResponse.json({ ok: true, revoked: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[DELETE /api/merchant/[slug]/qr/[token]]', err);
    return NextResponse.json({ error: 'Failed to revoke QR.' }, { status: 500 });
  }
}
