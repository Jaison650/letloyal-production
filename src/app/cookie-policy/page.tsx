import LegalLayout from '@/components/marketing/LegalLayout';

export const metadata = {
  title: 'Cookie Policy — LetLoyal',
  description: 'LetLoyal Cookie Policy — how we use cookies under the DPDP Act 2023.',
};

export default function CookiePolicyPage() {
  return (
    <LegalLayout title="Cookie Policy" updated="Last updated: July 2026">
      <section>
        <h2>1. What Are Cookies?</h2>
        <p>Cookies are small text files placed on your device when you visit a website. We use them in accordance with India&apos;s Digital Personal Data Protection Act 2023 (DPDP Act). Your explicit opt-in consent is required before any non-essential cookie is set.</p>
      </section>
      <section>
        <h2>2. Necessary Cookies</h2>
        <p>These are required for the platform to function. They include your login session token and security identifiers. You cannot opt out of necessary cookies while using the service — they are set on the legal basis of contract performance.</p>
      </section>
      <section>
        <h2>3. Analytics Cookies (Optional)</h2>
        <p>With your explicit consent (opt-in), we use Microsoft Clarity to understand how visitors interact with our platform. Clarity may set cookies to record session replays and heatmaps. No personal data collected via Clarity is sold to third parties.</p>
        <p className="mt-3">You can withdraw consent at any time by visiting <strong>My Rewards → Account Settings</strong> and toggling off &quot;Usage analytics&quot;, or by clearing site data for letloyal.com in your browser settings.</p>
      </section>
      <section>
        <h2>4. Your Rights Under DPDP Act 2023</h2>
        <p>You have the right to withdraw your analytics consent at any time without affecting any service you receive. Withdrawal is effective immediately — no further analytics data will be collected from your session.</p>
      </section>
      <section>
        <h2>5. Contact</h2>
        <p>Questions about our cookie use? Email <a href="mailto:hello@letloyal.com">hello@letloyal.com</a>.</p>
      </section>
    </LegalLayout>
  );
}
