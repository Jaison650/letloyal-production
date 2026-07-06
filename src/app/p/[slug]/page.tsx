import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import Link from 'next/link';
import { queryOne } from '@/lib/db';
import { PoweredBy } from '@/components/ui/Logo';
import { MapPin, Instagram, Star, Globe, Gift, CheckCircle } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://letloyal.in';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const merchant = await queryOne<{ business_name: string; address: string | null }>(
    'SELECT business_name, address FROM merchants WHERE slug = ? AND status = ?',
    [slug, 'active'],
  );
  if (!merchant) return {};

  const name = merchant.business_name;
  const title = `${name} — Loyalty Rewards`;
  const desc  = `Earn loyalty rewards at ${name}${merchant.address ? `, ${merchant.address}` : ''}.`;

  return {
    title,
    description: desc,
    alternates: { canonical: `${BASE_URL}/p/${slug}` },
    openGraph: {
      title, description: desc,
      url: `${BASE_URL}/p/${slug}`,
    },
  };
}

interface MerchantBranding {
  id:                string;
  slug:              string;
  business_name:     string;
  logo_url:          string | null;
  banner_url:        string | null;
  address:           string | null;
  gmaps_url:         string | null;
  instagram_url:     string | null;
  google_review_url: string | null;
  website_url:       string | null;
  latitude:          string | null;
  longitude:         string | null;
}

interface ActiveCampaign {
  campaign_type:      'visit_based' | 'spend_based';
  reward_description: string;
  reward_threshold:   number;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function MerchantProfilePage({ params }: PageProps) {
  const { slug } = await params;

  const merchant = await queryOne<MerchantBranding>(
    `SELECT id, slug, business_name, logo_url, banner_url,
            address, gmaps_url, instagram_url, google_review_url, website_url,
            latitude, longitude
       FROM merchants WHERE slug = ? AND status = 'active'`,
    [slug],
  );
  if (!merchant) notFound();

  const campaign = await queryOne<ActiveCampaign>(
    `SELECT campaign_type, reward_description, reward_threshold
       FROM campaigns WHERE merchant_id = ? AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
    [merchant.id],
  );

  const isVisit = campaign?.campaign_type === 'visit_based';

  return (
    <div className="min-h-screen bg-bg-muted flex flex-col">

      {/* ── Merchant branded header ─────────────────────────────────── */}
      <header className="bg-white shadow-sm">

        {merchant.banner_url && (
          <div className="relative w-full h-36 overflow-hidden">
            <Image
              src={merchant.banner_url}
              alt={`${merchant.business_name} banner`}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="px-5 py-4 flex items-center gap-4">
          {merchant.logo_url && (
            <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-border-light shadow-sm">
              <Image
                src={merchant.logo_url}
                alt={`${merchant.business_name} logo`}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-text-dark truncate">
              {merchant.business_name}
            </h1>
            {merchant.address && (
              <p className="flex items-center gap-1 text-xs text-text-light mt-0.5 truncate">
                <MapPin size={11} className="flex-shrink-0" />
                {merchant.address}
              </p>
            )}
          </div>
        </div>

        {(merchant.gmaps_url || merchant.instagram_url || merchant.google_review_url || merchant.website_url) && (
          <div className="px-5 pb-4 flex flex-wrap gap-3">
            {merchant.gmaps_url && (
              <a href={merchant.gmaps_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-text-medium hover:text-primary transition-colors font-medium">
                <MapPin size={13} /> Directions
              </a>
            )}
            {merchant.instagram_url && (
              <a href={merchant.instagram_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-text-medium hover:text-primary transition-colors font-medium">
                <Instagram size={13} /> Instagram
              </a>
            )}
            {merchant.google_review_url && (
              <a href={merchant.google_review_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-text-medium hover:text-primary transition-colors font-medium">
                <Star size={13} /> Review Us
              </a>
            )}
            {merchant.website_url && (
              <a href={merchant.website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-text-medium hover:text-primary transition-colors font-medium">
                <Globe size={13} /> Website
              </a>
            )}
          </div>
        )}

        {merchant.latitude && merchant.longitude && (
          <div className="px-5 pb-4">
            <iframe
              title="Map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(merchant.longitude) - 0.006},${Number(merchant.latitude) - 0.006},${Number(merchant.longitude) + 0.006},${Number(merchant.latitude) + 0.006}&layer=mapnik&marker=${merchant.latitude},${merchant.longitude}`}
              className="w-full h-40 rounded-xl border border-border-light"
              loading="lazy"
            />
          </div>
        )}
      </header>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-6 max-w-sm mx-auto w-full space-y-4">

        {!campaign ? (
          <div className="text-center py-10 text-text-medium">
            <p className="text-lg font-semibold mb-1">No active loyalty program</p>
            <p className="text-sm">Check back soon!</p>
          </div>
        ) : (
          <>
            {/* ── Campaign card ──────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
              <div className="bg-primary px-5 py-3 flex items-center justify-between">
                <p className="text-white text-sm font-bold">Active Loyalty Program</p>
                <span className="text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {isVisit ? 'Visit-based' : 'Spend-based'}
                </span>
              </div>

              <div className="px-5 py-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                    <Gift size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-medium uppercase tracking-wide">Reward</p>
                    <p className="font-bold text-text-dark text-sm mt-0.5">{campaign.reward_description}</p>
                  </div>
                </div>

                <div className="bg-bg-muted rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-extrabold text-primary">{campaign.reward_threshold}</p>
                  <p className="text-xs text-text-medium mt-0.5">
                    {isVisit ? `visits to reward` : `points to reward`}
                  </p>
                </div>
              </div>
            </div>

            {/* ── How it works ───────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-border-light shadow-sm px-5 py-4">
              <p className="text-xs font-bold text-text-medium uppercase tracking-wide mb-3">How to earn</p>
              <ol className="space-y-3">
                {[
                  `Visit ${merchant.business_name}`,
                  isVisit ? 'Scan the QR code shown at checkout' : 'Scan the QR code and enter the amount spent',
                  isVisit
                    ? `Earn 1 stamp per visit — reach ${campaign.reward_threshold} to unlock: ${campaign.reward_description}`
                    : `Earn points on every rupee spent — reach ${campaign.reward_threshold} points to unlock: ${campaign.reward_description}`,
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text-dark">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* ── CTA ────────────────────────────────────────────────── */}
            <Link
              href="/my-rewards"
              className="btn-primary w-full text-center block py-3 rounded-2xl font-bold text-sm"
            >
              View My Rewards
            </Link>
          </>
        )}
      </main>

      <footer className="py-4 text-center">
        <PoweredBy />
      </footer>
    </div>
  );
}
