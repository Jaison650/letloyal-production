import { NextRequest, NextResponse } from 'next/server';
import { withTransaction, queryOne } from '@/lib/db';

// ── Types ─────────────────────────────────────────────────────────────
interface QRTokenRow {
  id:            string;
  merchant_id:   string;
  campaign_id:   string;
  amount_rupees: number | null;
  status:        'active' | 'used' | 'revoked';
  safety_expiry: Date;
}

interface CampaignRow {
  id:                 string;
  merchant_id:        string;
  campaign_type:      'visit_based' | 'spend_based';
  status:             string;
  reward_threshold:   number;
  reward_description: string;
  points_per_rupee:   number | null;
}


interface CustomerMerchantRow {
  id:            string;
  progress:      number;
  cycle_number:  number;
  reward_status: 'in_progress' | 'unlocked';
}

interface MerchantRow {
  business_name: string;
}

// ── Phone normalisation (India) ───────────────────────────────────────
// Accepts: 10-digit, +91XXXXXXXXXX, 91XXXXXXXXXX, 091XXXXXXXXXX
// Returns: +91XXXXXXXXXX (E.164) or null if invalid
// MUST match the format used by customer auth (normalizePhone in utils.ts)
function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '').replace(/^(91|0)/, '');
  if (digits.length !== 10) return null;
  return `+91${digits}`;
}

// ── POST /api/scan ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, phone_number, name } = body as {
      token:        string;
      phone_number: string;
      name?:        string;
    };

    // ── 1. Validate inputs ────────────────────────────────────────────
    if (!token || !phone_number) {
      return NextResponse.json(
        { error: 'Invalid request. Please scan the QR code again.' },
        { status: 400 },
      );
    }

    // ── 2. Phone validation ───────────────────────────────────────────
    const phone = normalisePhone(String(phone_number));
    if (!phone) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number.' },
        { status: 422 },
      );
    }

    // ── 3. Token lookup ───────────────────────────────────────────────
    const qrToken = await queryOne<QRTokenRow>(
      `SELECT id, merchant_id, campaign_id, amount_rupees, status, safety_expiry
         FROM qr_tokens WHERE token = ?`,
      [token],
    );

    if (!qrToken) {
      return NextResponse.json(
        { error: 'Invalid QR code. Please ask the merchant to regenerate.' },
        { status: 404 },
      );
    }

    if (qrToken.status === 'used') {
      return NextResponse.json(
        { error: 'This QR code has already been used.' },
        { status: 422 },
      );
    }

    if (qrToken.status === 'revoked') {
      return NextResponse.json(
        { error: 'This QR code was cancelled. Please ask the merchant to generate a new one.' },
        { status: 422 },
      );
    }

    if (new Date() > new Date(qrToken.safety_expiry)) {
      return NextResponse.json(
        { error: 'This QR code has expired. Ask the merchant to generate a new one.' },
        { status: 422 },
      );
    }

    // ── 4. Load campaign ──────────────────────────────────────────────
    const campaign = await queryOne<CampaignRow>(
      `SELECT id, merchant_id, campaign_type, status,
              reward_threshold, reward_description, points_per_rupee
         FROM campaigns WHERE id = ?`,
      [qrToken.campaign_id],
    );

    if (!campaign || campaign.status !== 'active') {
      return NextResponse.json(
        { error: 'This campaign is currently paused. No stamps earned.' },
        { status: 422 },
      );
    }

    // ── 5. Load merchant name ─────────────────────────────────────────
    const merchant = await queryOne<MerchantRow>(
      'SELECT business_name FROM merchants WHERE id = ?',
      [qrToken.merchant_id],
    );

    // ── 6. Core transaction ───────────────────────────────────────────
    const result = await withTransaction(async (client) => {

      // ── 6a. Atomic token claim ──────────────────────────────────────
      const claimResult = await client.query(
        `UPDATE qr_tokens
            SET status = 'used', used_at = NOW()
          WHERE id = ? AND status = 'active'`,
        [qrToken.id],
      );

      // rows affected = 0 means race condition (someone else scanned simultaneously)
      if ((claimResult.affectedRows ?? 0) === 0) {
        throw Object.assign(new Error('ALREADY_USED'), { code: 'ALREADY_USED' });
      }

      // ── 6b. Find-or-create customer ─────────────────────────────────
      const customerRows = await client.query(
        'SELECT id, name FROM customers WHERE phone_number = ?',
        [phone],
      );

      let customerId: string;
      let isFirstVisit = false;

      if (customerRows.rows.length === 0) {
        isFirstVisit = true;
        const newId = crypto.randomUUID();
        await client.query(
          `INSERT INTO customers (id, phone_number, name)
           VALUES (?, ?, ?)`,
          [newId, phone, name?.trim() || null],
        );
        customerId = newId;
      } else {
        customerId = customerRows.rows[0].id as string;
        const storedName = customerRows.rows[0].name as string | null;

        // Backfill name if provided and not yet stored
        if (!storedName && name?.trim()) {
          await client.query(
            'UPDATE customers SET name = ? WHERE id = ?',
            [name.trim(), customerId],
          );
        }
      }

      // ── 6c. Find-or-create customer_merchant ────────────────────────
      const cmRows = await client.query(
        `SELECT id, progress, cycle_number, reward_status
           FROM customer_merchant
          WHERE customer_id = ? AND campaign_id = ?`,
        [customerId, campaign.id],
      );

      let cm: CustomerMerchantRow;
      if (cmRows.rows.length === 0) {
        const newCmId = crypto.randomUUID();
        await client.query(
          `INSERT INTO customer_merchant
             (id, customer_id, merchant_id, campaign_id, progress, cycle_number, reward_status)
           VALUES (?, ?, ?, ?, 0, 1, 'in_progress')`,
          [newCmId, customerId, qrToken.merchant_id, campaign.id],
        );
        cm = { id: newCmId, progress: 0, cycle_number: 1, reward_status: 'in_progress' };
      } else {
        cm = cmRows.rows[0] as unknown as CustomerMerchantRow;
      }

      // ── 6d. Block if reward already unlocked ─────────────────────────
      if (cm.reward_status === 'unlocked') {
        throw Object.assign(new Error('REWARD_PENDING'), { code: 'REWARD_PENDING' });
      }

      // ── 6e. Compute points_added ──────────────────────────────────────
      let pointsAdded: number;
      if (campaign.campaign_type === 'visit_based') {
        pointsAdded = 1;
      } else {
        if (!qrToken.amount_rupees || !campaign.points_per_rupee) {
          throw Object.assign(new Error('INVALID_AMOUNT'), { code: 'INVALID_AMOUNT' });
        }
        pointsAdded = Math.floor(qrToken.amount_rupees * campaign.points_per_rupee);
        if (pointsAdded <= 0) {
          throw Object.assign(new Error('AMOUNT_TOO_SMALL'), { code: 'AMOUNT_TOO_SMALL' });
        }
      }

      // ── 6f. Update progress ───────────────────────────────────────────
      const newProgress     = cm.progress + pointsAdded;
      const rewardUnlocked  = newProgress >= campaign.reward_threshold;
      const newRewardStatus = rewardUnlocked ? 'unlocked' : 'in_progress';

      await client.query(
        `UPDATE customer_merchant
            SET progress = ?, reward_status = ?, last_scan_at = NOW()
          WHERE id = ?`,
        [newProgress, newRewardStatus, cm.id],
      );

      // ── 6g. Insert visits row ─────────────────────────────────────────
      await client.query(
        `INSERT INTO visits
           (id, customer_id, merchant_id, campaign_id, points_added, amount_rupees)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          customerId,
          qrToken.merchant_id,
          campaign.id,
          pointsAdded,
          qrToken.amount_rupees ?? null,
        ],
      );

      return {
        progress:          newProgress,
        threshold:         campaign.reward_threshold,
        reward_unlocked:   rewardUnlocked,
        reward_description: campaign.reward_description,
        points_added:      pointsAdded,
        is_first_visit:    isFirstVisit,
        campaign_type:     campaign.campaign_type,
      };
    });

    return NextResponse.json({
      ok:                 true,
      business_name:      merchant?.business_name ?? '',
      progress:           result.progress,
      threshold:          result.threshold,
      reward_unlocked:    result.reward_unlocked,
      reward_description: result.reward_description,
      points_added:       result.points_added,
      is_first_visit:     result.is_first_visit,
      campaign_type:      result.campaign_type,
    });

  } catch (err: unknown) {
    // ── Named error codes from inside the transaction ─────────────────
    const code = (err as { code?: string }).code;

    if (code === 'ALREADY_USED') {
      return NextResponse.json(
        { error: 'This QR code has already been scanned.' },
        { status: 409 },
      );
    }
    if (code === 'REWARD_PENDING') {
      return NextResponse.json(
        { error: 'You already have a reward waiting! Show this to the staff to redeem it first.' },
        { status: 422 },
      );
    }
    if (code === 'AMOUNT_TOO_SMALL') {
      return NextResponse.json(
        { error: 'Amount too small to earn points. Minimum spend required.' },
        { status: 422 },
      );
    }

    console.error('[POST /api/scan]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
