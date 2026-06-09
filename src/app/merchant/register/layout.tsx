import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Merchant Account — LetLoyal',
  robots: { index: false, follow: false },
};

export default function MerchantRegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
