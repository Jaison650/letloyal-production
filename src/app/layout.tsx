import type { Metadata } from 'next';
import './globals.css';
import ClarityScript from '@/components/ClarityScript';

const BASE_URL = 'https://pilot.letloyal.com';
const OG_IMAGE = `${BASE_URL}/api/og`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:  'LetLoyal — QR Loyalty for Indian Merchants',
    template: '%s | LetLoyal',
  },
  description: 'Turn your QR code into a professional loyalty program. No app. No hardware. Live in 10 minutes.',
  keywords: ['loyalty program India', 'QR loyalty card', 'digital stamp card', 'customer retention India', 'loyalty app for small business'],
  authors: [{ name: 'LetLoyal', url: BASE_URL }],
  creator: 'LetLoyal',
  openGraph: {
    type:        'website',
    locale:      'en_IN',
    url:         BASE_URL,
    siteName:    'LetLoyal',
    title:       'LetLoyal — QR Loyalty for Indian Merchants',
    description: 'Turn your QR code into a professional loyalty program. No app. No hardware. Live in 10 minutes.',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'LetLoyal — QR Loyalty for Indian Merchants' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'LetLoyal — QR Loyalty for Indian Merchants',
    description: 'Turn your QR code into a professional loyalty program. No app. No hardware. Live in 10 minutes.',
    images:      [OG_IMAGE],
  },
  alternates: { canonical: BASE_URL },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LetLoyal',
  url: BASE_URL,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'QR-based digital loyalty program platform for Indian merchants. No app needed for customers.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  provider: { '@type': 'Organization', name: 'LetLoyal', url: BASE_URL },
  areaServed: { '@type': 'Country', name: 'India' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ClarityScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
