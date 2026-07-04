import { NextRequest, NextResponse } from 'next/server';
import { withTransaction, queryOne } from '@/lib/db';
import { pushToMerchant, pushToCustomer } from '@/lib/webpush';

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
  id:                   string;
  merchant_id:          string;
  campaign_type:        'visit_based' | 'spend_based';
  status:               string;
  reward_threshold:     number;
  reward_description:   string;
  points_per_rupee:     number | null;
  streak_enabled:    number;   // 0 | 1
  streak_period:     'day' | 'week' | 'month';
  streak_days:       number;
  streak_multiplier: number;
}

interface CustomerMerchantRow {
  id:               string;
  progress:         number;
  cycle_number:     number;
  reward_status:    'in_progress' | 'unlocked';
  current_streak:   number;
  streak_last_date: string | null;  // MySQL DATE as string 'YYYY-MM-DD'
}

interface MerchantRow {
  business_name: string;
  slug:          string;
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

// ── Streak helpers ────────────────────────────────────────────────────
// Returns today's date string in IST (YYYY-MM-DD)
function todayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// Returns a period key for a date string, used to compare calendar periods
function periodKey(date: string, period: 'day' | 'week' | 'month'): string {
  if (period === 'day') return date;
  const d = new Date(date + 'T00:00:00');
  if (period === 'month') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  // week: ISO week — Mon-based
  const tmp = new Date(d);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7));
  const yearStart = new Date(tmp.getFullYear(), 0, 1);
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

// Checks if lastDate is exactly the PREVIOUS period relative to today
function isConsecutivePeriod(lastDate: string, today: string, period: 'day' | 'week' | 'month'): boolean {
  if (period === 'day') {
    const diffDays = Math.round((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000);
    return diffDays === 1;
  }
  if (period === 'week') {
    const [lastYear, lastWeek] = periodKey(lastDate, 'week').split('-W').map(Number);
    const [curYear,  curWeek]  = periodKey(today, 'week').split('-W').map(Number);
    if (curYear === lastYear) return curWeek - lastWeek === 1;
    // handle year boundary (week 52/53 → week 1)
    return curYear - lastYear === 1 && curWeek === 1 && lastWeek >= 52;
  }
  // month
  const [lastYear, lastMon] = periodKey(lastDate, 'month').split('-').map(Number);
  const [curYear,  curMon]  = periodKey(today, 'month').split('-').map(Number);
  return (curYear * 12 + curMon) - (lastYear * 12 + lastMon) === 1;
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

    // ── 4. Load campaign (including streak config) ────────────────────
    const campaign = await queryOne<CampaignRow>(
      `SELECT id, merchant_id, campaign_type, status,
              reward_threshold, reward_description, points_per_rupee,
              streak_enabled, streak_period, streak_days, streak_multiplier
         FROM campaigns WHERE id = ?`,
      [qrToken.campaign_id],
    );

    if (!campaign || campaign.status !== 'active') {
      return NextResponse.json(
        { error: 'This campaign is currently paused. No stamps earned.' },
        { status: 422 },
      );
    }

    // ── 5. Load merchant name + slug ──────────────────────────────────
    const merchant = await queryOne<MerchantRow>(
      'SELECT business_name, slug FROM merchants WHERE id = ?',
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
        `SELECT id, progress, cycle_number, reward_status, current_streak, streak_last_date
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
        cm = { id: newCmId, progress: 0, cycle_number: 1, reward_status: 'in_progress', current_streak: 0, streak_last_date: null };
      } else {
        cm = cmRows.rows[0] as unknown as CustomerMerchantRow;
      }

      // ── 6d. Note if reward was already waiting (no longer a hard block) ─
      const rewardAlreadyWaiting = cm.reward_status === 'unlocked';

      // ── 6e. Compute base points_added ────────────────────────────────
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

      // ── 6f. Streak calculation ────────────────────────────────────────
      let newStreak = 1;
      let streakBonus = false;

      if (campaign.streak_enabled) {
        const today    = todayIST();
        const lastDate = cm.streak_last_date ?? null;
        const period   = campaign.streak_period ?? 'day';

        // Same period = don't advance, don't reset (e.g. second scan same day/week/month)
        const samePeriod = !!lastDate && periodKey(lastDate, period) === periodKey(today, period);
        // Consecutive period = advance streak
        const consecutive = !!lastDate && isConsecutivePeriod(lastDate, today, period);

        if (samePeriod) {
          // Already scanned in this period — keep streak as-is
          newStreak = cm.current_streak;
        } else if (consecutive) {
          // Perfect consecutive period — increment
          newStreak = cm.current_streak + 1;
        } else {
          // Gap too long or first scan — reset to 1
          newStreak = 1;
        }

        // Apply multiplier if milestone reached (not on same-period rescan)
        if (!samePeriod && newStreak >= campaign.streak_days) {
          streakBonus = true;
          pointsAdded = Math.ceil(pointsAdded * campaign.streak_multiplier);
        }

        // Update streak columns (only write new date if this is a new period)
        await client.query(
          `UPDATE customer_merchant
              SET current_streak = ?, streak_last_date = ?
            WHERE id = ?`,
          [newStreak, samePeriod ? lastDate : today, cm.id],
        );
      }

      // ── 6g. Update progress ───────────────────────────────────────────
      const newProgress = cm.progress + pointsAdded;
      const justUnlocked    = !rewardAlreadyWaiting && newProgress >= campaign.reward_threshold;
      const newRewardStatus = (rewardAlreadyWaiting || justUnlocked) ? 'unlocked' : 'in_progress';

      await client.query(
        `UPDATE customer_merchant
            SET progress = ?, reward_status = ?, last_scan_at = NOW()
          WHERE id = ?`,
        [newProgress, newRewardStatus, cm.id],
      );

      // ── 6h. Insert visits row ─────────────────────────────────────────
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
        progress:               newProgress,
        threshold:              campaign.reward_threshold,
        reward_unlocked:        justUnlocked,
        reward_already_waiting: rewardAlreadyWaiting,
        reward_description:     campaign.reward_description,
        points_added:           pointsAdded,
        is_first_visit:         isFirstVisit,
        campaign_type:          campaign.campaign_type,
        streak_enabled:     Boolean(campaign.streak_enabled),
        streak_count:       campaign.streak_enabled ? newStreak : 0,
        streak_bonus:       streakBonus,
        streak_days_target: campaign.streak_days,
        streak_multiplier:  campaign.streak_multiplier,
        streak_period:      campaign.streak_period ?? 'day',
      };
    });

    // Fire-and-forget push to merchant on notable events only
    if (result.is_first_visit || result.reward_unlocked) {
      const pushMsg = result.is_first_visit
        ? `🆕 New customer! ${result.points_added} ${result.campaign_type === 'visit_based' ? 'stamp' : 'point'}${result.points_added !== 1 ? 's' : ''} earned`
        : `🏆 Reward unlocked! A customer just earned: ${result.reward_description}`;
      pushToMerchant(qrToken.merchant_id, 'LetLoyal Alert', pushMsg).catch(() => {});
    }

    // Fire-and-forget proximity push to customer (milestone nudge)
    // Fires once: when customer just crossed the "≤2 away" boundary this scan
    if (!result.reward_unlocked && !result.reward_already_waiting) {
      const remaining = result.threshold - result.progress;
      const unit = result.campaign_type === 'visit_based' ? 'visit' : 'point';
      const unitPlural = remaining === 1 ? unit : `${unit}s`;
      // "≤2 away" for visit_based; "≤10% remaining" for spend_based
      const nearMilestone = result.campaign_type === 'visit_based'
        ? remaining <= 2
        : result.progress / result.threshold >= 0.8;
      if (nearMilestone) {
        const bizName = merchant?.business_name ?? 'us';
        const scanUrl = merchant?.slug ? `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://letloyal.in'}/my-rewards?merchant=${merchant.slug}` : '/my-rewards';
        const nudgeMsg = remaining === 1
          ? `Just 1 ${unit} away from ${result.reward_description} at ${bizName}! Come back soon 🎯`
          : `Only ${remaining} ${unitPlural} away from your reward at ${bizName}! Keep it up 🔥`;
        pushToCustomer(phone, qrToken.merchant_id, `${bizName} — almost there!`, nudgeMsg, scanUrl).catch(() => {});
      }
    }

    return NextResponse.json({
      ok:                     true,
      business_name:          merchant?.business_name ?? '',
      progress:               result.progress,
      threshold:              result.threshold,
      reward_unlocked:        result.reward_unlocked,
      reward_already_waiting: result.reward_already_waiting,
      reward_description:     result.reward_description,
      points_added:           result.points_added,
      is_first_visit:         result.is_first_visit,
      campaign_type:          result.campaign_type,
      streak_enabled:     result.streak_enabled,
      streak_count:       result.streak_count,
      streak_bonus:       result.streak_bonus,
      streak_days_target: result.streak_days_target,
      streak_multiplier:  result.streak_multiplier,
      streak_period:      result.streak_period,
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
