import Link from 'next/link';
import Logo from '@/components/ui/Logo';

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Product',
    links: [
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  {
    heading: 'For Customers',
    links: [{ label: 'My Rewards', href: '/my-rewards' }],
  },
  {
    heading: 'Merchant',
    links: [
      { label: 'Create Account', href: '/merchant/register' },
      { label: 'Merchant Login', href: '/merchant/login' },
      { label: 'Merchant Terms', href: '/merchant-terms' },
      { label: 'Merchant Rights', href: '/merchant-rights' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
      { label: 'Customer Privacy', href: '/customer-policy' },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="bg-section-dark text-[#AEBDB5] py-14 px-4 border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
          <div>
            <div className="mb-3"><Logo variant="dark" size={26} /></div>
            <p className="text-sm max-w-xs leading-relaxed">
              QR-first loyalty for local merchants.<br />No app. No hardware. Just loyal customers.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="font-display font-bold text-white mb-3">{col.heading}</p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="hover:text-[#9FE7CC] transition-colors">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-xs text-center text-[#7C8C84]">
          © 2026 LetLoyal. India Pilot. 🇮🇳
        </div>
      </div>
    </footer>
  );
}
