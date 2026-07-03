// src/lib/analyticsConsent.ts
// Client-side store for the customer's OPTIONAL analytics consent (DPDP 2023).
// Behavioural analytics (Microsoft Clarity) is not necessary to run a loyalty
// account, so under the DPDP Act it requires its own free, specific, opt-in
// consent — kept separate from the (required) account-processing consent and
// withdrawable at any time.

const KEY = 'll_analytics_consent';
const EVENT = 'll-analytics-consent-change';

/** True only when the customer has explicitly opted in. Default: false. */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** Record (or withdraw) analytics consent and notify listeners in-page. */
export function setAnalyticsConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, granted ? '1' : '0');
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable — fail closed (no analytics) */
  }
}

export const ANALYTICS_CONSENT_EVENT = EVENT;
