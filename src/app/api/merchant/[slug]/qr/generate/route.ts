import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireMerchant } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { generateQRDataUrl } from '@/lib/qr';

const SAFETY_EXPIRY_MINUTES = Number(process.env.QR_SAFETY_EXPIRY_MINUTES) || 30;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface ActiveCampaign {
  id:               string;
  campaign_type:    'visit_based' | 'spend_based';
  points_per_rupee: number | null;
}

type RouteContext = { params: Promise<{ slug: string }> };

// ── POST /api/merchant/[slug]/qr/generate ────────────────────────────
// Body: { amount_rupees?: number, item_name?: string, quantity?: number }
// Returns: { token, qr_data_url, safety_expiry, campaign_type, amount_rupees }
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const auth = requireMerchant(req, slug);

    const body = await req.json().catch(() => ({}));
    const { amount_rupees, item_name, quantity } = body as { amount_rupees?: number; item_name?: string; quantity?: number };

    // ── Load active campaign ──────────────────────────────────────────
    const campaign = await queryOne<ActiveCampaign>(
      `SELECT c.id, c.campaign_type, c.points_per_rupee
         FROM campaigns c
        WHERE c.merchant_id = ? AND c.status = 'active'
        ORDER BY c.created_at DESC
        LIMIT 1`,
      [auth.sub],
    );

    if (!campaign) {
      return NextResponse.json(
        { error: 'No active campaign. Create one before generating QR codes.' },
        { status: 404 },
      );
    }

    // ── Validate amount for spend-based ──────────────────────────────
    if (campaign.campaign_type === 'spend_based') {
      if (!amount_rupees || typeof amount_rupees !== 'number' || amount_rupees <= 0) {
        return NextResponse.json(
          { error: 'Amount is required for spend-based campaigns.' },
          { status: 400 },
        );
      }
    }

    // ── Create token ──────────────────────────────────────────────────
    const token        = crypto.randomBytes(32).toString('hex');
    const safetyExpiry = new Date(Date.now() + SAFETY_EXPIRY_MINUTES * 60 * 1000);

    const safeItemName = typeof item_name === 'string' && item_name.trim() ? item_name.trim().slice(0, 120) : null;
    const safeQty       = typeof quantity === 'number' && quantity >= 1 && quantity <= 99 ? Math.floor(quantity) : 1;

    await query(
      `INSERT INTO qr_tokens
         (id, token, merchant_id, campaign_id, amount_rupees, item_name, quantity, safety_expiry)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
      [
        token,
        auth.sub,
        campaign.id,
        campaign.campaign_type === 'spend_based' ? (amount_rupees ?? null) : null,
        safeItemName,
        safeQty,
        safetyExpiry,
      ],
    );

    // ── Generate QR data URL ──────────────────────────────────────────
    const scanUrl = `${BASE_URL}/s/${slug}?t=${token}`;
    const qrDataUrl = await generateQRDataUrl(scanUrl);

    return NextResponse.json({
      ok:            true,
      token,
      qr_data_url:   qrDataUrl,
      safety_expiry: safetyExpiry.toISOString(),
      campaign_type: campaign.campaign_type,
      amount_rupees: campaign.campaign_type === 'spend_based' ? amount_rupees : null,
      item_name:     safeItemName,
      quantity:      safeQty,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[POST /api/merchant/[slug]/qr/generate]', err);
    return NextResponse.json(
      { error: "Couldn't generate QR — try again." },
      { status: 500 },
    );
  }
}
