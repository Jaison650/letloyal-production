import type { Metadata } from 'next';
import './globals.css';
import ClarityScript from '@/components/ClarityScript';

export const metadata: Metadata = {
  title: 'LetLoyal — QR Loyalty for Indian Merchants',
  description: 'Turn your QR code into a professional loyalty program. No app. No hardware. Live in 10 minutes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ClarityScript />
      </body>
    </html>
  );
}
