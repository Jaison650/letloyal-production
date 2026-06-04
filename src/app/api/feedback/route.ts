import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';

// ── POST /api/feedback ────────────────────────────────────────────────
// Body: { merchant_id, phone_number?, message, rating?, is_anonymous }
// No auth — public endpoint. Customer identity resolved by phone.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      merchant_id,
      phone_number,
      message,
      rating,
      is_anonymous = false,
    } = body as {
      merchant_id:  string;
      phone_number?: string;
      message:      string;
      rating?:      number | null;
      is_anonymous?: boolean;
    };

    // ── Validate merchant_id ──────────────────────────────────────────
    if (!merchant_id) {
      return NextResponse.json({ error: 'merchant_id is required.' }, { status: 400 });
    }

    const merchant = await queryOne<{ id: string }>(
      'SELECT id FROM merchants WHERE id = ? AND status = ?',
      [merchant_id, 'active'],
    );
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found.' }, { status: 404 });
    }

    // ── Validate message ──────────────────────────────────────────────
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }
    if (message.trim().length > 500) {
      return NextResponse.json(
        { error: 'Message is too long (max 500 characters).' },
        { status: 400 },
      );
    }

    // ── Validate rating ───────────────────────────────────────────────
    if (rating !== undefined && rating !== null) {
      const r = Number(rating);
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5.' },
          { status: 400 },
        );
      }
    }

    // ── Resolve customer_id (non-anonymous only) ──────────────────────
    let customerId: string | null = null;
    if (!is_anonymous && phone_number) {
      const digits = String(phone_number).replace(/\D/g, '');
      const phone  = digits.length === 10
        ? digits
        : digits.length === 12 && digits.startsWith('91')
          ? digits.slice(2)
          : null;

      if (phone) {
        const customer = await queryOne<{ id: string }>(
          'SELECT id FROM customers WHERE phone_number = ?',
          [phone],
        );
        customerId = customer?.id ?? null;
      }
    }

    // ── Insert feedback ───────────────────────────────────────────────
    await query(
      `INSERT INTO feedback (id, merchant_id, customer_id, message, rating, is_anonymous)
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [
        merchant_id,
        is_anonymous ? null : customerId,
        message.trim(),
        rating ?? null,
        is_anonymous ? 1 : 0,
      ],
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/feedback]', err);
    return NextResponse.json(
      { error: 'Failed to submit feedback. Please try again.' },
      { status: 500 },
    );
  }
}
