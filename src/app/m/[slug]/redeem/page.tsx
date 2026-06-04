import { redirect } from 'next/navigation';
import { getMerchantAuthFromCookies } from '@/lib/auth';
import RedemptionValidator from '@/components/merchant/RedemptionValidator';
import { Gift } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function RedeemPage({ params }: PageProps) {
  const { slug } = await params;

  const auth = await getMerchantAuthFromCookies();
  if (!auth || auth.slug !== slug) redirect('/merchant/login');

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
          <Gift size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Redeem Reward</h1>
          <p className="text-sm text-text-medium">
            Look up a customer by phone number to redeem their reward.
          </p>
        </div>
      </div>

      <RedemptionValidator slug={slug} />
    </div>
  );
}
