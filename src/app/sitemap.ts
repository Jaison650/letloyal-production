import { MetadataRoute } from 'next';
import { query } from '@/lib/db';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://letloyal.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const merchants = await query<{ slug: string; updated_at: string }>(
    `SELECT slug, updated_at FROM merchants WHERE status = 'active' ORDER BY created_at DESC`,
  ).catch(() => [] as { slug: string; updated_at: string }[]);

  const merchantUrls: MetadataRoute.Sitemap = merchants.map(m => ({
    url:             `${BASE}/s/${m.slug}`,
    lastModified:    new Date(m.updated_at),
    changeFrequency: 'weekly' as const,
    priority:        0.8,
  }));

  return [
    { url: BASE,                          lastModified: new Date(), changeFrequency: 'weekly',  priority: 1   },
    { url: `${BASE}/merchant/login`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy-policy`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/terms-of-service`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ...merchantUrls,
  ];
}
