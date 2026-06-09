import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// POST /api/push/subscribe
// Registers a push subscription for a merchant or customer.
// Body: { type: 'merchant' | 'customer', ownerId: string, merchantId?: string, subscription: PushSubscription }
export async function POST(req: NextRequest) {
  try {
    const { type, ownerId, merchantId, subscription } = await req.json();

    if (!type || !ownerId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription payload.' }, { status: 400 });
    }
    if (type !== 'merchant' && type !== 'customer') {
      return NextResponse.json({ error: 'Invalid type.' }, { status: 400 });
    }
    if (type === 'customer' && !merchantId) {
      return NextResponse.json({ error: 'merchantId required for customer subscriptions.' }, { status: 400 });
    }

    // Upsert — if endpoint already exists for this owner, update keys
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM push_subscriptions WHERE endpoint = ? AND owner_id = ?',
      [subscription.endpoint, ownerId],
    );

    if (existing) {
      await query(
        'UPDATE push_subscriptions SET p256dh = ?, auth = ? WHERE id = ?',
        [subscription.keys.p256dh, subscription.keys.auth, existing.id],
      );
    } else {
      await query(
        `INSERT INTO push_subscriptions (owner_type, owner_id, merchant_id, endpoint, p256dh, auth)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [type, ownerId, merchantId ?? null, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth],
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/push/subscribe]', err);
    return NextResponse.json({ error: 'Failed to register subscription.' }, { status: 500 });
  }
}

// DELETE /api/push/subscribe — unsubscribe
export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: 'endpoint required.' }, { status: 400 });
    await query('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/push/subscribe]', err);
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
