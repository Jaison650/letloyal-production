import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Merchant Login — LetLoyal',
};

export default function MerchantLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
