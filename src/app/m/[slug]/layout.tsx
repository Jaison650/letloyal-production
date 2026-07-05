import { redirect } from 'next/navigation';
import { getMerchantAuthFromCookies } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import DashboardShell from '@/components/merchant/DashboardShell';

interface MerchantProfile {
  id:            string;
  slug:          string;
  business_name: string;
  logo_url:      string | null;
}

interface LayoutProps {
  children: React.ReactNode;
  params:   Promise<{ slug: string }>;
}

export default async function MerchantDashboardLayout({ children, params }: LayoutProps) {
  const { slug } = await params;

  // 1. Auth check
  const auth = await getMerchantAuthFromCookies();
  if (!auth) {
    redirect('/merchant/login');
  }

  // 2. Slug ownership check — prevent cross-tenant access
  if (auth.slug !== slug) {
    redirect(`/m/${auth.slug}`);
  }

  // 3. Load merchant profile
  const merchant = await queryOne<MerchantProfile>(
    'SELECT id, slug, business_name, logo_url FROM merchants WHERE id = ? AND status = ?',
    [auth.sub, 'active'],
  );

  if (!merchant) {
    redirect('/merchant/login');
  }

  return (
    <DashboardShell slug={slug} businessName={merchant.business_name} logoUrl={merchant.logo_url}>
      {children}
    </DashboardShell>
  );
}
