import LegalLayout from '@/components/marketing/LegalLayout';

export const metadata = {
  title: 'Merchant Data Rights — LetLoyal',
  description: 'LetLoyal Merchant Data Rights under the DPDP Act 2023.',
};

export default function MerchantRightsPage() {
  return (
    <LegalLayout title="Merchant Data Rights" updated="Last updated: July 2026">
      <section>
        <h2>1. Your Rights Under DPDP Act 2023</h2>
        <p>Under India&apos;s Digital Personal Data Protection Act 2023, merchants whose personal data is processed by LetLoyal have the following rights:</p>
        <ul className="list-disc ml-6 mt-2 space-y-1">
          <li><strong>Access</strong> — request a summary of personal data we hold about you or your business.</li>
          <li><strong>Correction</strong> — ask us to correct inaccurate or incomplete business or personal information.</li>
          <li><strong>Erasure</strong> — request deletion of your merchant account and all associated personal data.</li>
          <li><strong>Portability</strong> — request an export of your business data (customer visit counts, redemption records) in a machine-readable format.</li>
          <li><strong>Grievance redressal</strong> — raise a complaint and receive a substantive response within 30 days.</li>
        </ul>
      </section>
      <section>
        <h2>2. What Data We Hold About Merchants</h2>
        <p>We hold the following personal and business data for merchants:</p>
        <ul className="list-disc ml-6 mt-2 space-y-1">
          <li>Business name, category, and description.</li>
          <li>Merchant email address and hashed password.</li>
          <li>QR code identifiers and loyalty programme configuration.</li>
          <li>Aggregated visit and redemption counts.</li>
        </ul>
        <p className="mt-3">We do not hold merchant bank account details or financial information on the LetLoyal platform.</p>
      </section>
      <section>
        <h2>3. How to Exercise Your Rights</h2>
        <p>To make any data rights request, email <a href="mailto:hello@letloyal.com">hello@letloyal.com</a> with the subject line &quot;Data Rights Request — [Your Business Name]&quot;. We will acknowledge your request within 48 hours and respond substantively within 30 days.</p>
      </section>
      <section>
        <h2>4. Grievance Officer</h2>
        <p>
          LetLoyal is operating as an invite-only pilot and is in the process of formal incorporation. All grievances are handled by the founding team.<br />
          <strong>Email:</strong>{' '}
          <a href="mailto:hello@letloyal.com">hello@letloyal.com</a><br />
          <strong>Response time:</strong> Acknowledged within 48 hours; resolved within 30 days.<br />
          <strong>Note:</strong> Legal entity name, CIN, and registered address will be updated upon incorporation.
        </p>
      </section>
      <section>
        <h2>5. Data Breach Notification</h2>
        <p>In the event of a personal data breach affecting your merchant account, LetLoyal will notify you at your registered email address within the timeframe required by the DPDP Act 2023.</p>
      </section>
    </LegalLayout>
  );
}
