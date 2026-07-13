import { redirect } from 'next/navigation';
import { getMerchantAuthFromCookies } from '@/lib/auth';
import FeedbackList from '@/components/merchant/FeedbackList';
import { MessageSquare } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function FeedbackPage({ params }: PageProps) {
  const { slug } = await params;

  const auth = await getMerchantAuthFromCookies();
  if (!auth || auth.slug !== slug) redirect('/merchant/login');

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal-subtle flex items-center justify-center">
          <MessageSquare size={20} className="text-teal" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Customer Feedback</h1>
          <p className="text-sm text-ink-sub">
            Reviews left by customers after their visit.
          </p>
        </div>
      </div>

      <FeedbackList slug={slug} />
    </div>
  );
}
