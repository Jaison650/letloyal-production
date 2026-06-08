import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export const metadata = {
  title: 'Privacy Policy — LetLoyal',
  description: 'LetLoyal Privacy Policy — how we collect, use, and protect your personal data under the DPDP Act 2023.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="bg-white border-b border-brand-border px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/"><Logo variant="light" size={26} /></Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-jakarta font-bold text-3xl text-text-dark mb-2">Privacy Policy</h1>
        <p className="text-text-light text-sm mb-10">Last updated: June 2026</p>
        <div className="space-y-8 text-text-medium leading-relaxed">
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">1. What We Collect</h2>
            <p>LetLoyal collects your name, mobile phone number, email address, and optionally your date of birth and gender when you register as a customer. Merchants provide their business name, email, and business details during onboarding.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">2. How We Use Your Data</h2>
            <p>Customer data is used solely to operate your loyalty card account — tracking visits, calculating rewards, and enabling redemption. We never sell your personal data to third parties. Merchants see only your first name and a masked phone number (e.g. 98••••666).</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">3. Data Storage</h2>
            <p>All data is stored securely on servers. Passwords are hashed using bcrypt and never stored in plain text. We use industry-standard encryption for data in transit (HTTPS/TLS).</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">4. Your Rights</h2>
            <p>Under the Digital Personal Data Protection Act 2023 (DPDP Act), you have the right to access, correct, and delete your personal data. To exercise these rights, contact us at privacy@letloyal.com.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">5. Cookies</h2>
            <p>We use essential cookies to maintain your login session. We do not use advertising or tracking cookies.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">6. Contact</h2>
            <p>For privacy-related questions, email <a href="mailto:privacy@letloyal.com" className="text-primary hover:underline">privacy@letloyal.com</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
