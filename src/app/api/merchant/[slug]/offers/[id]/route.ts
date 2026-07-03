import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

type RouteContext = { params: Promise<{ slug: string; id: string }> };

// DELETE offer
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug, id } = await params;
    const auth = requireMerchant(req, slug);

    const offer = await queryOne<{ id: string }>(
      'SELECT id FROM instant_offers WHERE id = ? AND merchant_id = ?',
      [id, auth.sub],
    );
    if (!offer) return NextResponse.json({ error: 'Offer not found.' }, { status: 404 });

    await query('DELETE FROM instant_offers WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[DELETE /api/merchant/[slug]/offers/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete offer.' }, { status: 500 });
  }
}
