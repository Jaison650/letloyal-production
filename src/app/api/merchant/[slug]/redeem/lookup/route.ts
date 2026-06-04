import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';

// ── Phone normalisation (same as scan route) ──────────────────────────
function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith('091')) return digits.slice(3);
  return null;
}

interface CustomerRow {
  id:   string;
  name: string | null;
}

interface UnlockedReward {
  customer_merchant_id: string;
  customer_name:        string | null;
  phone_number:         string;
  campaign_name:        string;
  reward_description:   string;
  reward_threshold:     number;
  progress:             number;
  cycle_number:         number;
}

type RouteContext = { params: Promise<{ slug: string }> };

// ── POST /api/merchant/[slug]/redeem/lookup ───────────────────────────
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const auth = requireMerchant(req, slug);

    const { phone_number } = await req.json();

    if (!phone_number) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const phone = normalisePhone(String(phone_number));
    if (!phone) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 },
      );
    }

    // ── Find customer ─────────────────────────────────────────────────
    const customer = await queryOne<CustomerRow>(
      'SELECT id, name FROM customers WHERE phone_number = ?',
      [phone],
    );

    if (!customer) {
      return NextResponse.json(
        { error: 'No customer found with this number.' },
        { status: 404 },
      );
    }

    // ── Find unlocked rewards for THIS merchant ───────────────────────
    const rewards = await query<UnlockedReward>(
      `SELECT
         cm.id            AS customer_merchant_id,
         cu.name          AS customer_name,
         cu.phone_number,
         ca.name          AS campaign_name,
         ca.reward_description,
         ca.reward_threshold,
         cm.progress,
         cm.cycle_number
       FROM customer_merchant cm
       JOIN campaigns  ca ON cm.campaign_id  = ca.id
       JOIN customers  cu ON cm.customer_id  = cu.id
      WHERE cm.merchant_id   = ?
        AND cm.customer_id   = ?
        AND cm.reward_status = 'unlocked'`,
      [auth.sub, customer.id],
    );

    if (rewards.length === 0) {
      return NextResponse.json(
        { error: 'This customer has no rewards ready to redeem.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, rewards });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[POST /api/merchant/[slug]/redeem/lookup]', err);
    return NextResponse.json({ error: 'Lookup failed. Please try again.' }, { status: 500 });
  }
}
