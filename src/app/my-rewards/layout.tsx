import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Rewards — LetLoyal',
  description: 'View your loyalty cards, scan QR codes, and redeem rewards at your favourite local merchants on LetLoyal.',
};

export default function MyRewardsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
