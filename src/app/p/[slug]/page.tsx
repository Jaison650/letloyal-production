import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import Link from 'next/link';
import { queryOne } from '@/lib/db';
import { PoweredBy } from '@/components/ui/Logo';
import { MapPin, Instagram, Star, Globe, Gift } from 'lucide-react';
import { merchantAccentVars } from '@/lib/merchantColor';

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
  brand_color:       string | null;
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
    `SELECT id, slug, business_name, logo_url, banner_url, brand_color,
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
    <div className="min-h-screen bg-surface-page flex flex-col" style={merchantAccentVars(merchant.slug, merchant.brand_color)}>

      {/* ── Merchant branded header — identity colour wash ──────────── */}
      <header className="relative bg-surface-1 shadow-ds border-b border-stroke overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(135deg, var(--m) 0%, transparent 62%)', opacity: 0.16 }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 w-52 h-52 rounded-full blur-3xl"
          style={{ background: 'var(--m)', opacity: 0.13 }}
        />

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

        <div className="relative px-5 py-4 flex items-center gap-4">
          {merchant.logo_url ? (
            <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-stroke shadow-ds">
              <Image
                src={merchant.logo_url}
                alt={`${merchant.business_name} logo`}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center font-display font-extrabold text-xl"
              style={{
                background: 'color-mix(in srgb, var(--m) 20%, transparent)',
                color: 'var(--m)',
                border: '1px solid color-mix(in srgb, var(--m) 34%, transparent)',
              }}
              aria-hidden
            >
              {merchant.business_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-display font-extrabold text-ink truncate">
              {merchant.business_name}
            </h1>
            {merchant.address && (
              <p className="flex items-center gap-1 text-xs text-ink-faint mt-0.5 truncate">
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
                className="flex items-center gap-1.5 text-xs text-ink-sub hover:text-teal transition-colors font-medium">
                <MapPin size={13} /> Directions
              </a>
            )}
            {merchant.instagram_url && (
              <a href={merchant.instagram_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-ink-sub hover:text-teal transition-colors font-medium">
                <Instagram size={13} /> Instagram
              </a>
            )}
            {merchant.google_review_url && (
              <a href={merchant.google_review_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-ink-sub hover:text-teal transition-colors font-medium">
                <Star size={13} /> Review Us
              </a>
            )}
            {merchant.website_url && (
              <a href={merchant.website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-ink-sub hover:text-teal transition-colors font-medium">
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
              className="w-full h-40 rounded-xl border border-stroke"
              loading="lazy"
            />
          </div>
        )}
      </header>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-6 max-w-sm mx-auto w-full space-y-4">

        {!campaign ? (
          <div className="text-center py-10 text-ink-sub">
            <p className="text-lg font-semibold mb-1">No active loyalty program</p>
            <p className="text-sm">Check back soon!</p>
          </div>
        ) : (
          <>
            {/* ── Programme chip — merchant identity, not a heavy band ── */}
            <span
              className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.05em] px-3 py-1.5 rounded-full"
              style={{
                background: 'color-mix(in srgb, var(--m) 15%, transparent)',
                color: 'var(--m)',
                border: '1px solid color-mix(in srgb, var(--m) 30%, transparent)',
              }}
            >
              ● Active loyalty program · {isVisit ? 'Visit-based' : 'Spend-based'}
            </span>

            {/* ── Reward panel — honey is the reward metal ───────────── */}
            <div className="rounded-[16px] border border-reward/30 bg-reward-subtle px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="w-[30px] h-[30px] rounded-[9px] bg-reward/15 flex items-center justify-center flex-shrink-0">
                  <Gift size={16} className="text-reward" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-[0.13em] text-reward-deep/75">Your reward</p>
                  <p className="font-display font-extrabold text-reward-deep text-[17px] leading-tight mt-1">
                    {campaign.reward_description}
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-3 pt-3 border-t border-reward/20">
                <span className="font-display font-extrabold text-2xl text-reward [font-variant-numeric:tabular-nums]">
                  {campaign.reward_threshold.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-ink-sub">
                  {isVisit ? 'visits to unlock' : 'points to unlock'}
                </span>
              </div>
            </div>

            {/* ── How it works ───────────────────────────────────────── */}
            <div className="bg-surface-1 rounded-[16px] border border-stroke shadow-ds px-5 py-4">
              <p className="text-xs font-bold text-ink-sub uppercase tracking-wide mb-3">How to earn</p>
              <ol className="space-y-3">
                {[
                  `Visit ${merchant.business_name}`,
                  isVisit ? 'Scan the QR code shown at checkout' : 'Scan the QR code and enter the amount spent',
                  isVisit
                    ? `Earn 1 stamp per visit — reach ${campaign.reward_threshold} to unlock: ${campaign.reward_description}`
                    : `Earn points on every rupee spent — reach ${campaign.reward_threshold} points to unlock: ${campaign.reward_description}`,
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center text-[9.5px] font-extrabold mt-0.5"
                      style={{
                        background: 'color-mix(in srgb, var(--m) 18%, transparent)',
                        color: 'var(--m)',
                      }}
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm text-ink-sub">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* ── CTA ────────────────────────────────────────────────── */}
            <Link
              href="/my-rewards"
              className="w-full text-center block py-3.5 rounded-full bg-teal text-teal-fg hover:bg-teal-hover transition-colors font-bold text-sm"
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
