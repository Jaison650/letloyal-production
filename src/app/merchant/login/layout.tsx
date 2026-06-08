import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Merchant Login — LetLoyal',
  description: 'Sign in to your LetLoyal merchant dashboard to manage loyalty campaigns, view customers, and track redemptions.',
};

export default function MerchantLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
