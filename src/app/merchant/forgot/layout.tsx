import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password — LetLoyal',
  description: 'Reset your LetLoyal merchant account password.',
};

export default function MerchantForgotLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
