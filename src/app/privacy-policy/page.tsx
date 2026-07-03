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
            <p>Under the Digital Personal Data Protection Act 2023 (DPDP Act), you have the right to access, correct, and delete your personal data. You may also request deletion of your account and all associated personal data by visiting your Account settings or by contacting us. To exercise these rights, contact us at hello@letloyal.com.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">5. Cookies</h2>
            <p>We use essential cookies to maintain your login session. We do not use advertising or tracking cookies.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">6. Contact</h2>
            <p>For privacy-related questions, email <a href="mailto:hello@letloyal.com" className="text-primary hover:underline">hello@letloyal.com</a>.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">7. Data Breach Notification</h2>
            <p>In the event of a personal data breach likely to result in risk to your rights or freedoms, LetLoyal will notify affected users and the Data Protection Board of India within the timeframe prescribed under the DPDP Act 2023. Notifications will be sent to the email address registered on your account.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">8. Data Storage & International Transfers</h2>
            <p>Your personal data is hosted on secure servers located in the European Union. Some service providers we rely on (for example, optional usage-analytics tools) may process data on servers outside India. Under the Digital Personal Data Protection Act 2023, personal data may be transferred to any country that has not been restricted by the Government of India; no such restriction currently applies to the jurisdictions we use. We do not sell your personal data, and all transfers are carried out consistent with the DPDP Act 2023.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">9. Your Rights Under DPDP Act 2023</h2>
            <p>Under the Digital Personal Data Protection Act 2023, you have the right to: (a) access information about your personal data processed by us; (b) correction and erasure of inaccurate or incomplete data; (c) grievance redressal; (d) nominate a representative. To exercise these rights, use the &ldquo;Delete My Account&rdquo; option in the My Rewards app or contact us at hello@letloyal.com.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">10. Grievance Contact</h2>
            <p>
              LetLoyal is currently operating as an invite-only beta pilot and is in the process of formal incorporation.
              During this period, all data-related grievances, requests, and concerns are handled directly by the founding team.
            </p>
            <p className="mt-3">
              <strong>Email:</strong>{' '}
              <a href="mailto:hello@letloyal.com" className="text-primary hover:underline">hello@letloyal.com</a><br />
              <strong>Response time:</strong> Grievances will be acknowledged within 48 hours and resolved within 30 days.<br />
              <strong>Note:</strong> Legal entity name, CIN, and registered address will be updated on this page upon incorporation.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
