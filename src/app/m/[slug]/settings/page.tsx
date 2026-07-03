import { redirect } from 'next/navigation';
import { getMerchantAuthFromCookies } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { DEFAULT_SPEED_DIALS } from '@/lib/constants';
import ProfileEditor from '@/components/merchant/ProfileEditor';

interface MerchantProfile {
  id:                string;
  slug:              string;
  business_name:     string;
  logo_url:          string | null;
  banner_url:        string | null;
  address:           string | null;
  gmaps_url:         string | null;
  instagram_url:     string | null;
  google_review_url: string | null;
  speed_dials:       string | null;
  latitude:          number | null;
  longitude:         number | null;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { slug } = await params;

  const auth = await getMerchantAuthFromCookies();
  if (!auth || auth.slug !== slug) redirect('/merchant/login');

  const merchant = await queryOne<MerchantProfile>(
    `SELECT id, slug, business_name, logo_url, banner_url, address,
            gmaps_url, instagram_url, google_review_url, speed_dials,
            latitude, longitude
       FROM merchants WHERE slug = ?`,
    [slug],
  );

  if (!merchant) redirect('/merchant/login');

  const initialData = {
    business_name:     merchant.business_name,
    logo_url:          merchant.logo_url,
    banner_url:        merchant.banner_url,
    address:           merchant.address,
    gmaps_url:         merchant.gmaps_url,
    instagram_url:     merchant.instagram_url,
    google_review_url: merchant.google_review_url,
    latitude:          merchant.latitude,
    longitude:         merchant.longitude,
    speed_dials:       !merchant.speed_dials
      ? DEFAULT_SPEED_DIALS
      : Array.isArray(merchant.speed_dials)
        ? (merchant.speed_dials as unknown as number[])
        : (JSON.parse(merchant.speed_dials as unknown as string) as number[]),
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-dark mb-1">Settings</h1>
      <p className="text-text-medium text-sm mb-6">
        Manage your store profile, branding, and speed dial amounts.
      </p>

      <ProfileEditor slug={slug} initialData={initialData} />
    </div>
  );
}
