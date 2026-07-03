import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Public endpoint — no auth required (customers find stores before logging in)
export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get('lat') ?? '');
  const lng = parseFloat(req.nextUrl.searchParams.get('lng') ?? '');

  if (!isFinite(lat) || !isFinite(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 });
  }

  // Haversine formula — returns stores within 5 km ordered by proximity
  const stores = await query<{
    id: string;
    business_name: string;
    slug: string;
    logo_url: string | null;
    distance_km: number;
  }>(
    `SELECT
       id, business_name, slug, logo_url,
       (6371 * ACOS(
         LEAST(1, COS(RADIANS(?)) * COS(RADIANS(latitude)) *
         COS(RADIANS(longitude) - RADIANS(?)) +
         SIN(RADIANS(?)) * SIN(RADIANS(latitude)))
       )) AS distance_km
     FROM merchants
     WHERE latitude IS NOT NULL
       AND longitude IS NOT NULL
       AND status = 'active'
     HAVING distance_km < 5
     ORDER BY distance_km
     LIMIT 20`,
    [lat, lng, lat],
  );

  return NextResponse.json({ ok: true, stores });
}
