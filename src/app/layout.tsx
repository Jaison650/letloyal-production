import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LetLoyal',
  description: 'Loyalty that brings customers back.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
