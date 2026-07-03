import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export const metadata = {
  title: 'Merchant Terms of Service — LetLoyal',
  description: 'LetLoyal Merchant Terms of Service — obligations, data handling, and service plans.',
};

export default function MerchantTermsPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="bg-white border-b border-brand-border px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/"><Logo variant="light" size={26} /></Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-jakarta font-bold text-3xl text-text-dark mb-2">Merchant Terms of Service</h1>
        <p className="text-text-light text-sm mb-10">Last updated: July 2026</p>
        <div className="space-y-8 text-text-medium leading-relaxed">
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">1. Acceptance</h2>
            <p>By creating a LetLoyal merchant account, you agree to these terms. If you do not agree, do not use the service. These terms apply to your use of the LetLoyal platform during the India Pilot period and thereafter.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">2. Merchant Obligations</h2>
            <p>You agree to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Honour all rewards earned by customers under your active loyalty program.</li>
              <li>Not discriminate between customers when honouring rewards.</li>
              <li>Keep your reward program details accurate and up to date on the platform.</li>
              <li>Inform LetLoyal promptly if you intend to close your business or terminate your loyalty program.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">3. Customer Data &amp; DPDP Act 2023</h2>
            <p>As a merchant using LetLoyal, you act as a joint data fiduciary for customer personal data visible to you on the platform. You agree to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Use customer data (name, masked phone) only for identifying customers during in-store redemption.</li>
              <li>Not record, copy, or store customer personal data outside of the LetLoyal platform.</li>
              <li>Not share customer data with any third party.</li>
              <li>Comply with the Digital Personal Data Protection Act 2023 in your use of customer data.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">4. Service Plans</h2>
            <p>LetLoyal is currently offered as a free pilot. Future service plans (Starter, Pro) will be communicated with at least 30 days&apos; notice before any paid tier is required. Existing merchants will not be automatically charged without explicit consent.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">5. Termination</h2>
            <p>Either party may terminate the merchant account at any time. On termination, your loyalty program will be deactivated and customers will no longer be able to earn new stamps. Existing unredeemed rewards may remain visible to customers for a transition period of 30 days.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">6. Limitation of Liability</h2>
            <p>LetLoyal is provided &quot;as is&quot; during the pilot period. We are not liable for losses arising from platform downtime, bugs, or data issues beyond what is required by applicable Indian law.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">7. Contact</h2>
            <p>Questions about these terms? Email <a href="mailto:hello@letloyal.com" className="text-primary hover:underline">hello@letloyal.com</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
