'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const KEY = 'll_analytics_consent';

function hasGivenConsent(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(KEY);
    return val !== null; // any stored value means they've decided
  } catch {
    return true;
  }
}

function saveConsent(analytics: boolean): void {
  try {
    localStorage.setItem(KEY, analytics ? '1' : '0');
    window.dispatchEvent(new Event('ll-analytics-consent-change'));
  } catch {}
}

export default function ConsentBanner() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!hasGivenConsent()) setShow(true);
  }, []);

  if (pathname.startsWith('/my-rewards')) return null;
  if (!show) return null;

  function accept(analytics: boolean) {
    saveConsent(analytics);
    setShow(false);
    const ref =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_ref: ref, categories: { necessary: true, analytics } }),
    }).catch(() => {});
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-brand-border p-5">
        <p className="font-jakarta font-bold text-sm text-text-dark mb-1">We use cookies</p>
        <p className="text-xs text-text-light mb-4">
          We use necessary cookies to operate the platform. We&apos;d also like to use optional
          analytics cookies to understand how you use LetLoyal, in accordance with India&apos;s{' '}
          <strong>Digital Personal Data Protection Act 2023</strong>.{' '}
          <Link href="/cookie-policy" className="text-primary hover:underline">
            Learn more
          </Link>
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => accept(true)}
            className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Accept All
          </button>
          <button
            onClick={() => accept(false)}
            className="flex-1 bg-gray-100 text-text-medium text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Necessary Only
          </button>
        </div>
      </div>
    </div>
  );
}
