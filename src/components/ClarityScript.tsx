'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

// Microsoft Clarity — session recording + heatmaps
// Privacy rules:
//   - /admin and /m/* routes are excluded (merchant + admin PII)
//   - All customer PII in the DOM is masked via data-clarity-mask="true"
//   - Clarity uses localStorage (no cookies) — GDPR compliant by default
//   - IP anonymisation must be enabled in the Clarity project dashboard
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? '';

const EXCLUDED_PREFIXES = ['/admin', '/m/'];

export default function ClarityScript() {
  const pathname = usePathname();

  // Don't load Clarity at all on merchant/admin pages
  if (!CLARITY_PROJECT_ID) return null;
  if (EXCLUDED_PREFIXES.some(p => pathname.startsWith(p))) return null;

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
