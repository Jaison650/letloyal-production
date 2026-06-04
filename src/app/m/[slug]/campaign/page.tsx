import { redirect } from 'next/navigation';
import { getMerchantAuthFromCookies } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import CampaignForm, { type Campaign } from '@/components/merchant/CampaignForm';
import { Megaphone } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params;

  const auth = await getMerchantAuthFromCookies();
  if (!auth || auth.slug !== slug) redirect('/merchant/login');

  // Fetch active or paused campaign
  const campaign = await queryOne<Campaign>(
    `SELECT c.id, c.name, c.campaign_type, c.status,
            c.reward_threshold, c.reward_description,
            c.points_per_rupee, c.created_at
       FROM campaigns c
       JOIN merchants m ON c.merchant_id = m.id
      WHERE m.slug = ? AND c.status IN ('active','paused')
      ORDER BY c.created_at DESC
      LIMIT 1`,
    [slug],
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
          <Megaphone size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-dark">
            {campaign ? 'Your Campaign' : 'Create a Campaign'}
          </h1>
          <p className="text-sm text-text-medium">
            {campaign
              ? 'Edit your loyalty campaign settings below.'
              : 'Set up how customers earn and redeem rewards.'}
          </p>
        </div>
      </div>

      {/* Info card when no campaign exists */}
      {!campaign && (
        <div className="mb-6 p-4 rounded-xl bg-primary-light/30 border border-primary/20 text-sm text-primary">
          <strong>No active campaign yet.</strong> Choose a type and launch your first campaign.
          Customers won&apos;t be able to earn points until a campaign is active.
        </div>
      )}

      <CampaignForm slug={slug} existing={campaign ?? null} />
    </div>
  );
}
