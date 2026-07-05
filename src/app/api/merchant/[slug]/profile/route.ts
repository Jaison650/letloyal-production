import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { MAX_URL_LENGTH, normalizeSpeedDials, type NamedDial } from '@/lib/constants';

interface MerchantProfileRow {
  id:                string;
  slug:              string;
  business_name:     string;
  logo_url:          string | null;
  banner_url:        string | null;
  address:           string | null;
  gmaps_url:         string | null;
  instagram_url:     string | null;
  google_review_url: string | null;
  speed_dials:       string | null;   // JSON string from MySQL
  latitude:          number | null;
  longitude:         number | null;
  status:            string;
  created_at:        string;
}

type RouteContext = { params: Promise<{ slug: string }> };

// ── Validate a URL field (must be https:// or empty) ──────────────────
function validateUrl(val: unknown, field: string): string | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val !== 'string') return `${field} must be a string.`;
  if (val.length > MAX_URL_LENGTH) return `${field} is too long (max ${MAX_URL_LENGTH} chars).`;
  if (!val.startsWith('https://')) return `${field} must start with https://`;
  return null;
}

// ── GET /api/merchant/[slug]/profile ─────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    requireMerchant(req, slug);

    const merchant = await queryOne<MerchantProfileRow>(
      `SELECT id, slug, business_name, logo_url, banner_url, address,
              gmaps_url, instagram_url, google_review_url, speed_dials,
              latitude, longitude, status, created_at
         FROM merchants WHERE slug = ?`,
      [slug],
    );

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found.' }, { status: 404 });
    }

    const rawDials = !merchant.speed_dials
      ? null
      : Array.isArray(merchant.speed_dials)
        ? merchant.speed_dials
        : JSON.parse(merchant.speed_dials as unknown as string);

    return NextResponse.json({
      ...merchant,
      speed_dials: normalizeSpeedDials(rawDials),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[GET /api/merchant/[slug]/profile]', err);
    return NextResponse.json({ error: 'Failed to load profile.' }, { status: 500 });
  }
}

// ── PUT /api/merchant/[slug]/profile ─────────────────────────────────
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    requireMerchant(req, slug);

    const body = await req.json();

    const {
      business_name,
      logo_url,
      banner_url,
      address,
      gmaps_url,
      instagram_url,
      google_review_url,
      speed_dials,
      latitude,
      longitude,
    } = body;

    // ── Validate URL fields ───────────────────────────────────────────
    const urlFields: [unknown, string][] = [
      [logo_url,          'Logo URL'],
      [banner_url,        'Banner URL'],
      [gmaps_url,         'Google Maps URL'],
      [instagram_url,     'Instagram URL'],
      [google_review_url, 'Google Review URL'],
    ];

    for (const [val, label] of urlFields) {
      const err = validateUrl(val, label);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }

    // ── Validate business name ────────────────────────────────────────
    if (business_name !== undefined) {
      if (typeof business_name !== 'string' || business_name.trim().length === 0) {
        return NextResponse.json({ error: 'Business name cannot be empty.' }, { status: 400 });
      }
      if (business_name.trim().length > 120) {
        return NextResponse.json({ error: 'Business name is too long (max 120 chars).' }, { status: 400 });
      }
    }

    // ── Validate speed dials / menu items — each item is either a plain
    // positive number (legacy) or { name, price, emoji? } ──────────────
    let cleanedDials: NamedDial[] | undefined;
    if (speed_dials !== undefined) {
      if (!Array.isArray(speed_dials) || speed_dials.length > 6) {
        return NextResponse.json({ error: 'Speed dials must be an array of 0–6 items.' }, { status: 400 });
      }
      cleanedDials = [];
      for (const item of speed_dials as unknown[]) {
        if (typeof item === 'number') {
          if (item <= 0) {
            return NextResponse.json({ error: 'Speed dial amounts must be positive.' }, { status: 400 });
          }
          cleanedDials.push({ name: '', price: item, emoji: '' });
          continue;
        }
        if (!item || typeof item !== 'object') {
          return NextResponse.json({ error: 'Invalid speed dial format.' }, { status: 400 });
        }
        const { name, price, emoji } = item as Record<string, unknown>;
        if (typeof price !== 'number' || price <= 0) {
          return NextResponse.json({ error: 'Speed dial price must be a positive number.' }, { status: 400 });
        }
        if (typeof name !== 'string') {
          return NextResponse.json({ error: 'Speed dial name must be a string.' }, { status: 400 });
        }
        if (name.trim().length > 40) {
          return NextResponse.json({ error: 'Speed dial name is too long (max 40 chars).' }, { status: 400 });
        }
        if (emoji !== undefined && emoji !== null && typeof emoji !== 'string') {
          return NextResponse.json({ error: 'Speed dial emoji must be a string.' }, { status: 400 });
        }
        cleanedDials.push({
          name:  name.trim().slice(0, 40),
          price,
          emoji: typeof emoji === 'string' ? emoji.slice(0, 8) : '',
        });
      }
    }

    // ── Build update ──────────────────────────────────────────────────
    const updates: string[] = [];
    const values:  unknown[] = [];

    const addField = (col: string, val: unknown) => {
      if (val !== undefined) {
        updates.push(`${col} = ?`);
        values.push(val === '' ? null : val);
      }
    };

    addField('business_name',     business_name?.trim());
    addField('logo_url',          logo_url);
    addField('banner_url',        banner_url);
    addField('address',           address);
    addField('gmaps_url',         gmaps_url);
    addField('instagram_url',     instagram_url);
    addField('google_review_url', google_review_url);

    if (cleanedDials !== undefined) {
      updates.push('speed_dials = ?');
      values.push(JSON.stringify(cleanedDials));
    }

    // ── Validate and store lat/lng (null clears the pin) ─────────────
    if (latitude !== undefined) {
      if (latitude === null) {
        updates.push('latitude = ?');
        values.push(null);
      } else {
        const lat = parseFloat(String(latitude));
        if (!isFinite(lat) || lat < -90 || lat > 90) {
          return NextResponse.json({ error: 'Invalid latitude.' }, { status: 400 });
        }
        updates.push('latitude = ?');
        values.push(lat);
      }
    }
    if (longitude !== undefined) {
      if (longitude === null) {
        updates.push('longitude = ?');
        values.push(null);
      } else {
        const lng = parseFloat(String(longitude));
        if (!isFinite(lng) || lng < -180 || lng > 180) {
          return NextResponse.json({ error: 'Invalid longitude.' }, { status: 400 });
        }
        updates.push('longitude = ?');
        values.push(lng);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
    }

    values.push(slug);
    await query(
      `UPDATE merchants SET ${updates.join(', ')} WHERE slug = ?`,
      values,
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[PUT /api/merchant/[slug]/profile]', err);
    return NextResponse.json({ error: 'Failed to save profile.' }, { status: 500 });
  }
}
