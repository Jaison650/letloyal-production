/**
 * session.ts — Server-only session helpers that hit the database.
 * Import from here (not auth.ts) when you need the full merchant row.
 * Do NOT import in middleware or client components.
 */
import { getMerchantAuthFromCookies, MerchantRow } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function getMerchantFromCookies(): Promise<MerchantRow | null> {
  const payload = await getMerchantAuthFromCookies();
  if (!payload) return null;
  return queryOne<MerchantRow>(
    `SELECT id, slug, business_name, logo_url, banner_url, address,
            gmaps_url, instagram_url, google_review_url, created_at
       FROM merchants WHERE id = ?`,
    [payload.sub],
  );
}
