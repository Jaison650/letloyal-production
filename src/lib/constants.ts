export const APP_NAME = 'LetLoyal';
export const POWERED_BY = 'Powered by LetLoyal';

// Merchant session: 7 days. Admin session: 12 hours.
export const MERCHANT_SESSION_MAX_AGE = 60 * 60 * 24 * 7;
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

// Default editable speed-dial presets (₹), used when a merchant has none set.
export const DEFAULT_SPEED_DIALS = [100, 200, 500, 1000];

// Currency for the India pilot.
export const CURRENCY_SYMBOL = '₹';

// Reject duplicate scans for the same customer + campaign within this window.
export const SCAN_IDEMPOTENCY_WINDOW_SECONDS = 60;
