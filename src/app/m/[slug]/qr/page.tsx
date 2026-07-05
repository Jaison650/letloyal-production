import { redirect } from 'next/navigation';
import { getMerchantAuthFromCookies } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { normalizeSpeedDials, type SpeedDial } from '@/lib/constants';
import QRPanel from '@/components/merchant/QRPanel';
import { QrCode } from 'lucide-react';

interface Campaign {
  id:             string;
  campaign_type:  'visit_based' | 'spend_based';
  name:           string;
  status:         string;
}

interface MerchantData {
  speed_dials: number[] | string | null;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function QRPage({ params }: PageProps) {
  const { slug } = await params;

  const auth = await getMerchantAuthFromCookies();
  if (!auth || auth.slug !== slug) redirect('/merchant/login');

  // Must have an active campaign to generate QR
  const campaign = await queryOne<Campaign>(
    `SELECT c.id, c.campaign_type, c.name, c.status
       FROM campaigns c
       JOIN merchants m ON c.merchant_id = m.id
      WHERE m.slug = ? AND c.status = 'active'
      ORDER BY c.created_at DESC
      LIMIT 1`,
    [slug],
  );

  if (!campaign) {
    redirect(`/m/${slug}/campaign`);
  }

  const merchant = await queryOne<MerchantData>(
    'SELECT speed_dials FROM merchants WHERE slug = ?',
    [slug],
  );

  const rawDials = merchant?.speed_dials;
  const parsedDials = !rawDials
    ? null
    : Array.isArray(rawDials)
      ? rawDials
      : JSON.parse(rawDials as string);
  const speedDials: SpeedDial[] = normalizeSpeedDials(parsedDials);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
          <QrCode size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-dark">QR Code</h1>
          <p className="text-sm text-text-medium">
            {campaign.campaign_type === 'visit_based'
              ? 'Show this QR to customers to stamp their card.'
              : 'Select an amount and show the QR to customers.'}
          </p>
        </div>
      </div>

      {/* Campaign info pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light text-primary text-xs font-semibold mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        {campaign.name} ·{' '}
        {campaign.campaign_type === 'visit_based' ? 'Visit-based' : 'Spend-based'}
      </div>

      {/* QR Panel — full logic client-side */}
      <div className="max-w-sm mx-auto">
        <QRPanel
          slug={slug}
          campaignType={campaign.campaign_type}
          speedDials={campaign.campaign_type === 'spend_based' ? speedDials : []}
        />
      </div>
    </div>
  );
}
