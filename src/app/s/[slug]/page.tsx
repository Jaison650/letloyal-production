import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { queryOne } from '@/lib/db';
import { PoweredBy } from '@/components/ui/Logo';
import ScanClient from '@/components/customer/ScanClient';
import { MapPin, Instagram, Star } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://letloyal.in';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const merchant = await queryOne<{ business_name: string; address: string | null }>(
    'SELECT business_name, address FROM merchants WHERE slug = ? AND status = ?',
    [slug, 'active'],
  );
  if (!merchant) return {};

  const name    = merchant.business_name;
  const title   = `${name} — Loyalty Rewards`;
  const desc    = `Earn loyalty rewards at ${name}${merchant.address ? `, ${merchant.address}` : ''}. Scan QR to join — no app needed.`;
  const ogImage = `${BASE_URL}/api/og?merchant=${encodeURIComponent(name)}&sub=${encodeURIComponent(desc)}`;

  return {
    title,
    description: desc,
    alternates:  { canonical: `${BASE_URL}/s/${slug}` },
    openGraph: {
      title, description: desc,
      url:    `${BASE_URL}/s/${slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description: desc, images: [ogImage] },
  };
}

// ── Types ─────────────────────────────────────────────────────────────
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
}

interface ActiveCampaign {
  id:                 string;
  campaign_type:      'visit_based' | 'spend_based';
  reward_description: string;
  reward_threshold:   number;
}

interface PageProps {
  params:      Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function ScanPage({ params, searchParams }: PageProps) {
  const { slug }  = await params;
  const { t: token } = await searchParams;

  // ── Load merchant branding ────────────────────────────────────────
  const merchant = await queryOne<MerchantBranding>(
    `SELECT id, slug, business_name, logo_url, banner_url,
            address, gmaps_url, instagram_url, google_review_url
       FROM merchants WHERE slug = ? AND status = 'active'`,
    [slug],
  );

  if (!merchant) notFound();

  // ── Load active campaign ──────────────────────────────────────────
  const campaign = await queryOne<ActiveCampaign>(
    `SELECT id, campaign_type, reward_description, reward_threshold
       FROM campaigns WHERE merchant_id = ? AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
    [merchant.id],
  );

  // ── Invalid / missing token states ───────────────────────────────
  const hasToken = !!token;
  const hasCampaign = !!campaign;

  return (
    <div className="min-h-screen bg-bg-muted flex flex-col">

      {/* ── Merchant branded header — NO LetLoyal branding ─────────── */}
      <header className="bg-white shadow-sm">

        {/* Banner */}
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

        {/* Logo + name row */}
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

        {/* Social links */}
        {(merchant.gmaps_url || merchant.instagram_url || merchant.google_review_url) && (
          <div className="px-5 pb-4 flex gap-3">
            {merchant.gmaps_url && (
              <a
                href={merchant.gmaps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-text-medium hover:text-primary transition-colors font-medium"
              >
                <MapPin size={13} /> Directions
              </a>
            )}
            {merchant.instagram_url && (
              <a
                href={merchant.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-text-medium hover:text-primary transition-colors font-medium"
              >
                <Instagram size={13} /> Instagram
              </a>
            )}
            {merchant.google_review_url && (
              <a
                href={merchant.google_review_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-text-medium hover:text-primary transition-colors font-medium"
              >
                <Star size={13} /> Review Us
              </a>
            )}
          </div>
        )}
      </header>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-6 max-w-sm mx-auto w-full">

        {/* No active campaign */}
        {!hasCampaign && (
          <div className="text-center py-10 text-text-medium">
            <p className="text-lg font-semibold mb-2">No active loyalty program</p>
            <p className="text-sm">Check back soon!</p>
          </div>
        )}

        {/* No token */}
        {hasCampaign && !hasToken && (
          <div className="text-center py-10 text-text-medium">
            <p className="text-lg font-semibold mb-2">Invalid QR code</p>
            <p className="text-sm">Please ask the merchant to regenerate the QR code.</p>
          </div>
        )}

        {/* Valid token + campaign → scan form */}
        {hasCampaign && hasToken && campaign && (
          <ScanClient
            token={token}
            merchantId={merchant.id}
            businessName={merchant.business_name}
            campaignType={campaign.campaign_type}
            slug={merchant.slug}
            googleReviewUrl={merchant.google_review_url ?? undefined}
          />
        )}
      </main>

      {/* ── "Powered by LetLoyal" footer — ONLY LetLoyal branding ─── */}
      <footer className="py-4 text-center">
        <PoweredBy />
      </footer>
    </div>
  );
}
