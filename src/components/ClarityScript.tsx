'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { hasAnalyticsConsent, ANALYTICS_CONSENT_EVENT } from '@/lib/analyticsConsent';

// Microsoft Clarity — session recording + heatmaps
// Privacy rules (DPDP Act 2023):
//   - Loads ONLY after the customer gives explicit, opt-in analytics consent
//     (default OFF). Consent is separate from account processing and can be
//     withdrawn from My Rewards → Data & Privacy.
//   - /admin and /m/* routes are excluded (merchant + admin PII)
//   - All customer PII in the DOM is masked via data-clarity-mask="true"
//   - IP anonymisation must be enabled in the Clarity project dashboard
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? '';

const EXCLUDED_PREFIXES = ['/admin', '/m/'];

export default function ClarityScript() {
  const pathname = usePathname();
  const [consented, setConsented] = useState(false);

  // Re-read consent on mount and whenever it changes (opt-in / withdrawal)
  useEffect(() => {
    const sync = () => setConsented(hasAnalyticsConsent());
    sync();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Don't load Clarity at all on merchant/admin pages
  if (!CLARITY_PROJECT_ID) return null;
  if (EXCLUDED_PREFIXES.some(p => pathname.startsWith(p))) return null;
  // No behavioural analytics without explicit opt-in consent
  if (!consented) return null;

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","${CLARITY_PROJECT_ID}");
        `,
      }}
    />
  );
}
