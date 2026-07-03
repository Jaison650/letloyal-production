import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export const metadata = {
  title: 'Customer Privacy Policy — LetLoyal',
  description: 'LetLoyal Customer Privacy Policy — your data rights under the DPDP Act 2023.',
};

export default function CustomerPolicyPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="bg-white border-b border-brand-border px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/"><Logo variant="light" size={26} /></Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-jakarta font-bold text-3xl text-text-dark mb-2">Customer Privacy Policy</h1>
        <p className="text-text-light text-sm mb-10">Last updated: July 2026</p>
        <div className="space-y-8 text-text-medium leading-relaxed">
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">1. Data We Collect</h2>
            <p>When you register as a LetLoyal customer, we collect your name, mobile phone number, and email address. Optionally, you may provide your date of birth and gender. We also record your visit and redemption history with each merchant you interact with.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">2. How We Use Your Data</h2>
            <p>Your personal data is used solely to operate your loyalty card account — tracking visits, calculating rewards, and enabling redemption at participating merchants. We never sell your personal data to third parties or use it for advertising.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">3. Data Sharing</h2>
            <p>Merchants you visit can see your first name and a masked phone number (e.g. 98••••666) to identify you during redemption. No other personal data is shared with merchants. We do not share your data with any other third parties except as required by law.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">4. Your Rights Under DPDP Act 2023</h2>
            <p>Under the Digital Personal Data Protection Act 2023, you have the right to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Access</strong> — request a summary of personal data we hold about you.</li>
              <li><strong>Correction</strong> — ask us to correct inaccurate or incomplete data.</li>
              <li><strong>Erasure</strong> — request deletion of your account and all associated personal data.</li>
              <li><strong>Portability</strong> — receive a copy of your data in a machine-readable format.</li>
              <li><strong>Grievance redressal</strong> — raise a complaint and receive a response within 30 days.</li>
              <li><strong>Nomination</strong> — nominate a representative to exercise your rights on your behalf.</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, use the &quot;Delete My Account&quot; option in your My Rewards page, or contact us at <a href="mailto:hello@letloyal.com" className="text-primary hover:underline">hello@letloyal.com</a>.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">5. Analytics Consent</h2>
            <p>Optional usage analytics (Microsoft Clarity) are only activated with your explicit opt-in consent. You can change your analytics preference at any time from Account Settings in the My Rewards page.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">6. Grievance Officer</h2>
            <p>
              All data-related grievances are handled by the LetLoyal founding team.<br />
              <strong>Email:</strong>{' '}
              <a href="mailto:hello@letloyal.com" className="text-primary hover:underline">hello@letloyal.com</a><br />
              <strong>Response time:</strong> Acknowledged within 48 hours; resolved within 30 days.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
