import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';

interface CampaignRow {
  id:                 string;
  merchant_id:        string;
  name:               string;
  campaign_type:      'visit_based' | 'spend_based';
  status:             'active' | 'paused' | 'ended';
  reward_threshold:   number;
  reward_description: string;
  points_per_rupee:   number | null;
  created_at:         string;
  updated_at:         string;
}

type RouteContext = { params: Promise<{ slug: string }> };

// ── Shared validation ─────────────────────────────────────────────────
function validateCampaignFields(body: Record<string, unknown>): string | null {
  const { name, campaign_type, reward_threshold, reward_description, points_per_rupee } = body;

  if (typeof name !== 'string' || name.trim().length === 0)
    return 'Campaign name is required.';
  if (name.trim().length > 120)
    return 'Campaign name is too long (max 120 chars).';

  if (campaign_type !== 'visit_based' && campaign_type !== 'spend_based')
    return 'Campaign type must be visit_based or spend_based.';

  const threshold = Number(reward_threshold);
  if (!Number.isInteger(threshold) || threshold < 1)
    return 'Reward threshold must be a whole number of at least 1.';

  if (typeof reward_description !== 'string' || reward_description.trim().length === 0)
    return 'Reward description is required.';
  if (reward_description.trim().length > 200)
    return 'Reward description is too long (max 200 chars).';

  if (campaign_type === 'spend_based') {
    const ppr = Number(points_per_rupee);
    if (!points_per_rupee || isNaN(ppr) || ppr <= 0)
      return 'Points per ₹ is required for spend-based campaigns and must be > 0.';
  }

  return null;
}

// ── GET /api/merchant/[slug]/campaign ─────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    requireMerchant(req, slug);

    const campaign = await queryOne<CampaignRow>(
      `SELECT c.* FROM campaigns c
         JOIN merchants m ON c.merchant_id = m.id
        WHERE m.slug = ? AND c.status IN ('active','paused')
        ORDER BY c.created_at DESC
        LIMIT 1`,
      [slug],
    );

    return NextResponse.json({ campaign: campaign ?? null });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[GET /api/merchant/[slug]/campaign]', err);
    return NextResponse.json({ error: 'Failed to load campaign.' }, { status: 500 });
  }
}

// ── POST /api/merchant/[slug]/campaign  (create) ──────────────────────
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const auth = requireMerchant(req, slug);

    const body = await req.json();
    const validationError = validateCampaignFields(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { name, campaign_type, reward_threshold, reward_description, points_per_rupee } = body;

    // Enforce one active campaign per merchant
    const existing = await queryOne<{ id: string }>(
      `SELECT c.id FROM campaigns c
         JOIN merchants m ON c.merchant_id = m.id
        WHERE m.slug = ? AND c.status = 'active'`,
      [slug],
    );

    if (existing) {
      return NextResponse.json(
        { error: 'You already have an active campaign. Edit or end it before creating a new one.' },
        { status: 409 },
      );
    }

    await query(
      `INSERT INTO campaigns
         (id, merchant_id, name, campaign_type, status,
          reward_threshold, reward_description, points_per_rupee)
       VALUES (UUID(), ?, ?, ?, 'active', ?, ?, ?)`,
      [
        auth.sub,
        name.trim(),
        campaign_type,
        Number(reward_threshold),
        reward_description.trim(),
        campaign_type === 'spend_based' ? Number(points_per_rupee) : null,
      ],
    );

    const created = await queryOne<CampaignRow>(
      `SELECT * FROM campaigns
        WHERE merchant_id = ? AND status = 'active'
        ORDER BY created_at DESC LIMIT 1`,
      [auth.sub],
    );

    return NextResponse.json({ ok: true, campaign: created }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[POST /api/merchant/[slug]/campaign]', err);
    return NextResponse.json({ error: 'Failed to create campaign.' }, { status: 500 });
  }
}

// ── PUT /api/merchant/[slug]/campaign  (edit active campaign) ─────────
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const auth = requireMerchant(req, slug);

    const body = await req.json();

    // Special case: status-only update (pause / resume / end)
    if (body.status && Object.keys(body).length === 1) {
      const { status } = body;
      if (!['active', 'paused', 'ended'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
      }
      await query(
        `UPDATE campaigns SET status = ?
          WHERE merchant_id = ? AND status != 'ended'
          ORDER BY created_at DESC LIMIT 1`,
        [status, auth.sub],
      );
      return NextResponse.json({ ok: true });
    }

    // Full field update
    const validationError = validateCampaignFields(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { name, campaign_type, reward_threshold, reward_description, points_per_rupee } = body;

    await query(
      `UPDATE campaigns
          SET name = ?, campaign_type = ?, reward_threshold = ?,
              reward_description = ?, points_per_rupee = ?
        WHERE merchant_id = ? AND status IN ('active','paused')
        ORDER BY created_at DESC LIMIT 1`,
      [
        name.trim(),
        campaign_type,
        Number(reward_threshold),
        reward_description.trim(),
        campaign_type === 'spend_based' ? Number(points_per_rupee) : null,
        auth.sub,
      ],
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[PUT /api/merchant/[slug]/campaign]', err);
    return NextResponse.json({ error: 'Failed to update campaign.' }, { status: 500 });
  }
}
