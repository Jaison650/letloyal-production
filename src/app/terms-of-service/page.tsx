import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export const metadata = {
  title: 'Terms of Service — LetLoyal',
  description: 'LetLoyal Terms of Service for the India Pilot. Governs use of the QR loyalty platform.',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="bg-white border-b border-brand-border px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/"><Logo variant="light" size={26} /></Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-jakarta font-bold text-3xl text-text-dark mb-2">Terms of Service</h1>
        <p className="text-text-light text-sm mb-10">Last updated: June 2026</p>
        <div className="space-y-8 text-text-medium leading-relaxed">
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">1. Acceptance</h2>
            <p>By using LetLoyal, you agree to these Terms. If you do not agree, do not use the service. LetLoyal is currently in an India Pilot phase.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">2. Service Description</h2>
            <p>LetLoyal provides a QR-based digital loyalty platform for merchants and their customers. Merchants create loyalty campaigns; customers earn and redeem rewards by scanning QR codes.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">3. Merchant Responsibilities</h2>
            <p>Merchants are responsible for honouring rewards earned by customers. LetLoyal acts as a technology provider, not a party to the loyalty agreement between merchant and customer.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">4. Prohibited Use</h2>
            <p>You may not use LetLoyal for fraudulent purposes, to spam customers, or to violate any applicable laws. Abuse may result in account termination.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">5. Limitation of Liability</h2>
            <p>LetLoyal is provided &quot;as is&quot; during the pilot phase. We are not liable for indirect or consequential damages arising from use of the service.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">6. Governing Law</h2>
            <p>These Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of courts in Kerala, India.</p>
          </section>
          <section>
            <h2 className="font-jakarta font-bold text-xl text-text-dark mb-3">7. Contact</h2>
            <p>Questions: <a href="mailto:legal@letloyal.com" className="text-primary hover:underline">legal@letloyal.com</a></p>
          </section>
        </div>
      </main>
    </div>
  );
}
