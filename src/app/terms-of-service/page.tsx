import LegalLayout from '@/components/marketing/LegalLayout';

export const metadata = {
  title: 'Terms of Service — LetLoyal',
  description: 'LetLoyal Terms of Service for the India Pilot. Governs use of the QR loyalty platform.',
};

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" updated="Last updated: June 2026">
      <section>
        <h2>1. Acceptance</h2>
        <p>By using LetLoyal, you agree to these Terms. If you do not agree, do not use the service. LetLoyal is currently in an India Pilot phase.</p>
      </section>
      <section>
        <h2>2. Service Description</h2>
        <p>LetLoyal provides a QR-based digital loyalty platform for merchants and their customers. Merchants create loyalty campaigns; customers earn and redeem rewards by scanning QR codes.</p>
      </section>
      <section>
        <h2>3. Merchant Responsibilities</h2>
        <p>Merchants are responsible for honouring rewards earned by customers. LetLoyal acts as a technology provider, not a party to the loyalty agreement between merchant and customer.</p>
      </section>
      <section>
        <h2>4. Prohibited Use</h2>
        <p>You may not use LetLoyal for fraudulent purposes, to spam customers, or to violate any applicable laws. Abuse may result in account termination.</p>
      </section>
      <section>
        <h2>5. Limitation of Liability</h2>
        <p>LetLoyal is provided &quot;as is&quot; during the pilot phase. We are not liable for indirect or consequential damages arising from use of the service.</p>
      </section>
      <section>
        <h2>6. Governing Law</h2>
        <p>These Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of courts in Kerala, India.</p>
      </section>
      <section>
        <h2>7. Pilot Phase Disclaimer</h2>
        <p>
          LetLoyal is currently operating as an invite-only beta pilot. The service is provided for testing and evaluation purposes.
          LetLoyal is in the process of formal business incorporation in India. Legal entity name, CIN, and registered address
          will be published on this page and the Privacy Policy upon incorporation. Until then, all legal correspondence
          should be directed to <a href="mailto:hello@letloyal.com">hello@letloyal.com</a>.
        </p>
      </section>
      <section>
        <h2>8. Contact</h2>
        <p>Questions: <a href="mailto:hello@letloyal.com">hello@letloyal.com</a></p>
      </section>
    </LegalLayout>
  );
}
